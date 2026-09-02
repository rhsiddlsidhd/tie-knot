import "server-only";
import mongoose from "mongoose";
import type { IOrder } from "@/models/order.model";
import { InvitationModel } from "@/models/invitation.model";
import { OrderModel } from "@/models/order.model";
import { PaymentModel } from "@/models/payment.model";
import { ProductModel } from "@/models/product.model";
import { ReviewModel } from "@/models/review.model";
import type { CreateOrderDto } from "@/core/schemas";
import {
  categoryRequiresShipping,
  encodeCursor,
  decodeCursor,
  generateUid,
  isValidPageLimit,
} from "@/core/utils";
import { dbConnect } from "@/db/connect";
import type {
  AdminOrderListPage,
  OrderDetail,
  OrderListItem,
  OrderListPage,
  OrderStatus,
  ProductCategory,
} from "@/core/domain";
import { AppError } from "@/core/domain";
import {
  DEFAULT_PAGE_SIZE,
  EXPIRED_ORDER_BATCH_LIMIT,
  INVITATION_INPUT_DEADLINE_DAYS,
  ORDER_PAGE_SIZE,
  ORDER_STATUSES,
  PENDING_ORDER_EXPIRE_HOURS,
} from "@/core/domain";
import { getProductQuantityBoundsService } from "./product";
import { requireAuth } from "./auth";

const assertObjectIdLike = (id: string, label: string): void => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("VALIDATION", `${label} 형식이 올바르지 않습니다.`);
  }
};

export const createOrderService = async (
  data: CreateOrderDto & { userId: string },
): Promise<IOrder> => {
  await dbConnect();

  assertObjectIdLike(data.userId, "사용자 ID");
  assertObjectIdLike(data.product.productId, "상품 ID");
  data.product.selectedFeatures.forEach((f) =>
    assertObjectIdLike(f.featureId, "옵션 ID"),
  );

  // REQ-5: 클라이언트가 보낸 수량을 신뢰하지 않고 DB에서 minQuantity/maxQuantity를
  // 다시 읽어 범위를 검증한다(요청 본문에는 이 두 값이 애초에 실리지 않는다).
  const bounds = await getProductQuantityBoundsService(data.product.productId);
  if (!bounds) {
    throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  }
  const { minQuantity, maxQuantity } = bounds;
  const quantity = data.product.quantity;
  if (!Number.isInteger(quantity) || quantity < minQuantity) {
    throw new AppError(
      "VALIDATION",
      `이 상품은 최소 ${minQuantity}개부터 주문할 수 있습니다.`,
    );
  }
  if (maxQuantity !== 0 && quantity > maxQuantity) {
    throw new AppError(
      "VALIDATION",
      `이 상품은 최대 ${maxQuantity}개까지 주문할 수 있습니다.`,
    );
  }

  // 실물 카테고리(모바일초대장 제외)는 배송 정보가 필수다 — 사용자에게 보이는
  // 1차 방어선(REQ-5 수량 검증과 같은 패턴). Order 모델의 conditional required는
  // 이 체크를 우회하는 미래의 다른 코드 경로를 막는 최후 방어선일 뿐이다.
  if (
    categoryRequiresShipping(data.product.category) &&
    (!data.shipping?.receiver ||
      !data.shipping.phone ||
      !data.shipping.address ||
      !data.shipping.addressDetail)
  ) {
    throw new AppError("VALIDATION", "배송 정보를 입력해주세요.");
  }

  const merchantUid = generateUid("ORDER");

  // 최종 결제가 계산: 상품가*수량 + 옵션 합산 → 할인율 적용 → 고정 할인 차감 → 음수 방지
  const productTotal =
    data.product.pricing.discountedPrice * data.product.quantity;
  const optionsTotal = data.product.selectedFeatures.reduce(
    (acc, f) => acc + f.price,
    0,
  );
  const subTotal = productTotal + optionsTotal;
  const discounted =
    subTotal * (1 - (data.discountRate || 0)) - (data.discountAmount || 0);
  const finalPrice = Math.max(0, Math.floor(discounted));

  // DB 저장을 위한 최종 데이터 가공(Trans)
  const orderData = {
    ...data,
    userId: new mongoose.Types.ObjectId(data.userId),
    merchantUid,
    finalPrice,
    product: {
      ...data.product,
      productId: new mongoose.Types.ObjectId(data.product.productId),
      selectedFeatures: data.product.selectedFeatures.map((f) => ({
        ...f,
        featureId: new mongoose.Types.ObjectId(f.featureId),
      })),
    },
  };

  const order = await OrderModel.create(orderData).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "주문 생성에 실패했습니다.",
    );
  });

  return order.toObject();
};

export async function createOrderForCurrentUserService(
  data: CreateOrderDto,
): Promise<IOrder> {
  const { userId } = await requireAuth();
  return createOrderService({ ...data, userId });
}

/**
 * 결제완료(CONFIRMED)됐지만 Invitation을 만들지 않은 채 기한을 넘긴
 * 주문을 조회한다(자동취소 대상). 순수 조회만 담당하고 실제 취소(PortOne 환불)는
 * payment.service의 cancelPayment가 맡는다(order.service가 payment.service를
 * import하면 순환 의존이 생기므로, 오케스트레이션은 호출부에서 두 함수를
 * 조합한다).
 */
export const findExpiredAwaitingInvitationOrders = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<IOrder[]> => {
  await dbConnect();

  const deadline = new Date();
  deadline.setDate(deadline.getDate() - INVITATION_INPUT_DEADLINE_DAYS);

  const invitations = await InvitationModel.find({ userId })
    .select("orderId")
    .lean();
  const invitationOrderIds = invitations.map(
    (invitation) => invitation.orderId,
  );

  return OrderModel.find({
    userId,
    orderStatus: "CONFIRMED",
    _id: { $nin: invitationOrderIds },
    confirmedAt: { $lt: deadline },
  }).lean<IOrder[]>();
};

/**
 * findExpiredAwaitingInvitationOrders의 전체 유저 스캔 버전 — 스케줄러 배치
 * (/api/cron/expired-orders)가 쓴다. 판정 조건(CONFIRMED + Invitation 미생성 +
 * confirmedAt 기한 초과)은 동일하고 userId 스코프만 없다.
 *
 * per-user 버전처럼 "유저의 Invitation 전체 → $nin" 순서로 짜면 전역에선 Invitation
 * 컬렉션 전체를 메모리로 올리게 된다. 대신 주문 후보를 먼저 조회하고 그 _id로만
 * Invitation을 역조회한다(orderId는 unique 인덱스라 $in 조회가 색인된다).
 *
 * EXPIRED_ORDER_BATCH_LIMIT은 주문 후보 조회가 아니라 Invitation 제외 필터를
 * 통과한 "실제 반환 대상"에만 적용한다 — 조회 단계에서 먼저 자르면, draft
 * 초대장이 있어(제외 대상) 정렬 순서상 상위를 차지하는 오래된 주문들이 매
 * 실행마다 같은 window를 채워 새로 들어온 진짜 미입력 주문을 영원히 못 보게
 * 만드는 기아(starvation) 상태가 될 수 있다. 후보 조회 자체는 이 컬렉션의
 * 실제 CONFIRMED+기한초과 규모에 비례하므로(Invitation 전체 컬렉션과 달리)
 * 상한 없이 조회해도 무제한 증가하지 않는다.
 */
export const findExpiredAwaitingInvitationOrdersForAllUsers = async (): Promise<
  IOrder[]
> => {
  await dbConnect();

  const deadline = new Date();
  deadline.setDate(deadline.getDate() - INVITATION_INPUT_DEADLINE_DAYS);

  const candidates = await OrderModel.find({
    orderStatus: "CONFIRMED",
    confirmedAt: { $lt: deadline },
  })
    .sort({ confirmedAt: 1 })
    .lean<IOrder[]>();

  if (candidates.length === 0) return [];

  const invitations = await InvitationModel.find({
    orderId: { $in: candidates.map((order) => order._id) },
  })
    .select("orderId")
    .lean();

  const orderIdsWithInvitation = new Set(
    invitations.map((invitation) => invitation.orderId.toString()),
  );

  return candidates
    .filter((order) => !orderIdsWithInvitation.has(order._id.toString()))
    .slice(0, EXPIRED_ORDER_BATCH_LIMIT);
};

export const getOrderSeviceByMerchantUid = async (
  merchantUid: string,
): Promise<IOrder | null> => {
  await dbConnect();

  const order = await OrderModel.findOne({ merchantUid }).lean<IOrder>();

  return order;
};

/**
 * 목록 행이 필요로 하는 부속 정보(상품 카테고리, 청첩장 상태·공개키, 가상계좌 입금
 * 안내)를 주문에 붙인다. 첫 페이지(Server Component)와 더보기(route handler)가
 * 이 변환을 공유하므로 조회 진입점이 갈려도 행 shape은 하나로 유지된다.
 *
 * .lean() 결과의 ObjectId 필드를 명시적으로 문자열화한다(services/AGENTS.md
 * 컨벤션) — Server Component가 Client Component로 그대로 넘기므로, ObjectId
 * 인스턴스가 하나라도 남으면 "Only plain objects..." 에러가 난다.
 */
const toOrderListItems = async (
  orders: IOrder[],
): Promise<OrderListItem[]> => {
  if (orders.length === 0) return [];

  const productIds = [
    ...new Set(orders.map((order) => order.product.productId.toString())),
  ];
  const orderIds = orders.map((order) => order._id);
  const paymentIds = orders
    .map((order) => order.paymentId)
    .filter((paymentId) => paymentId !== undefined);

  const [products, invitations, payments, reviews] = await Promise.all([
    ProductModel.find({ _id: { $in: productIds } })
      .select("category")
      .lean(),
    InvitationModel.find({ orderId: { $in: orderIds } })
      .select("orderId status publicKey")
      .lean(),
    paymentIds.length > 0
      ? PaymentModel.find({ _id: { $in: paymentIds } })
          .select("status methodDetail.virtualAccount")
          .lean()
      : [],
    ReviewModel.find({ orderId: { $in: orderIds } })
      .select("orderId rating content images")
      .lean(),
  ]);

  const categories = new Map(
    products.map((product) => [product._id.toString(), product.category]),
  );
  const invitationsByOrder = new Map(
    invitations.map((invitation) => [
      invitation.orderId.toString(),
      invitation,
    ]),
  );
  const paymentsById = new Map(
    payments.map((payment) => [payment._id.toString(), payment]),
  );
  const reviewsByOrder = new Map(
    reviews.map((review) => [
      review.orderId.toString(),
      {
        id: review._id.toString(),
        rating: review.rating,
        content: review.content,
        images: review.images,
      },
    ]),
  );

  return orders.map((order) => {
    const invitation = invitationsByOrder.get(order._id.toString());
    const payment = order.paymentId
      ? paymentsById.get(order.paymentId.toString())
      : undefined;
    // 입금 대기 중인 가상계좌만 계좌번호를 노출한다 — 이미 입금·취소된 결제의
    // 계좌 정보는 행에서 안내할 이유가 없다.
    const virtualAccount =
      payment?.status === "PENDING"
        ? payment.methodDetail?.virtualAccount
        : undefined;

    return {
      ...order,
      _id: order._id.toString(),
      invitationStatus: invitation?.status,
      invitationPublicKey:
        invitation?.status === "published" ? invitation.publicKey : undefined,
      virtualAccount,
      review: reviewsByOrder.get(order._id.toString()) ?? null,
      userId: order.userId.toString(),
      paymentId: order.paymentId?.toString(),
      product: {
        ...order.product,
        category: categories.get(order.product.productId.toString()),
        productId: order.product.productId.toString(),
        selectedFeatures: order.product.selectedFeatures.map((f) => ({
          ...f,
          featureId: f.featureId.toString(),
        })),
      },
    };
  });
};

type OrderListQuery = {
  userId: string | mongoose.Types.ObjectId;
  status?: OrderStatus;
  category?: ProductCategory;
  cursor?: string;
  limit?: number;
};

/**
 * my-orders 목록 한 페이지를 조회한다 — (createdAt, _id) 복합 커서로 페이징하고,
 * 다음 페이지가 있으면 마지막 행 기준 커서를 함께 리턴한다. 같은 createdAt을 가진
 * 주문이 있어도 _id를 tie-breaker로 써서 행이 중복되거나 건너뛰어지지 않는다.
 */
export const getOrdersPageForUser = async ({
  userId,
  status,
  category,
  cursor,
  limit = ORDER_PAGE_SIZE,
}: OrderListQuery): Promise<OrderListPage> => {
  await dbConnect();

  const filter: mongoose.FilterQuery<IOrder> = { userId };

  if (status) {
    filter.orderStatus = status;
  }

  // 카테고리는 주문 스냅샷이 아니라 Product 문서에만 있으므로, 해당 카테고리
  // 상품 ID를 먼저 모아 주문 쪽 productId로 좁힌다.
  if (category) {
    const categoryProducts = await ProductModel.find({ category })
      .select("_id")
      .lean();
    filter["product.productId"] = {
      $in: categoryProducts.map((product) => product._id),
    };
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded || !mongoose.isObjectIdOrHexString(decoded.id)) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
      },
    ];
  }

  // 다음 페이지 존재 여부는 limit+1건을 읽어 판별한다(별도 count 쿼리 없이).
  const found = await OrderModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<IOrder[]>();

  const hasMore = found.length > limit;
  const orders = hasMore ? found.slice(0, limit) : found;
  const lastOrder = orders.at(-1);

  return {
    items: await toOrderListItems(orders),
    nextCursor:
      hasMore && lastOrder
        ? encodeCursor({
            createdAt: lastOrder.createdAt,
            id: lastOrder._id.toString(),
          })
        : null,
  };
};

type AdminOrderListQuery = {
  status?: OrderStatus;
  cursor?: string;
  limit?: number;
};

type AdminOrderListRow = {
  _id: mongoose.Types.ObjectId;
  merchantUid: string;
  buyerName: string;
  product: { title: string };
  orderStatus: OrderStatus;
  finalPrice: number;
  createdAt: Date;
};

/**
 * 관리자 전역 주문 목록 한 페이지 — 소유자 스코프 없이 전체 주문을 대상으로 한다.
 * my-orders(getOrdersPageForUser)와 정렬·커서 계약(createdAt desc, _id tie-break,
 * limit+1)은 공유하지만, Invitation/Payment 조인 없이 주문 스냅샷만으로 채울 수 있는
 * 최소 필드만 select한다 — 목록에 필요 이상의 문서 필드나 Mongoose 인스턴스를
 * 노출하지 않는다.
 */
export const getAdminOrdersPageService = async ({
  status,
  cursor,
  limit = DEFAULT_PAGE_SIZE,
}: AdminOrderListQuery): Promise<AdminOrderListPage> => {
  await dbConnect();

  if (!isValidPageLimit(limit)) {
    throw new AppError("VALIDATION", "잘못된 페이지 크기입니다.");
  }
  if (status && !ORDER_STATUSES.includes(status)) {
    throw new AppError("VALIDATION", "잘못된 주문 상태입니다.");
  }

  const filter: mongoose.FilterQuery<IOrder> = {};

  if (status) {
    filter.orderStatus = status;
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError("VALIDATION", "잘못된 페이지 커서입니다.");
    }
    filter.$or = [
      { createdAt: { $lt: decoded.createdAt } },
      {
        createdAt: decoded.createdAt,
        _id: { $lt: new mongoose.Types.ObjectId(decoded.id) },
      },
    ];
  }

  const found = await OrderModel.find(filter)
    .select("merchantUid buyerName product.title orderStatus finalPrice createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<AdminOrderListRow[]>()
    .catch((err) => {
      throw new AppError(
        "INTERNAL",
        err instanceof Error ? err.message : "주문 목록 조회에 실패했습니다.",
      );
    });

  const hasMore = found.length > limit;
  const orders = hasMore ? found.slice(0, limit) : found;
  const lastOrder = orders.at(-1);

  return {
    items: orders.map((order) => ({
      id: order._id.toString(),
      merchantUid: order.merchantUid,
      buyerName: order.buyerName,
      productTitle: order.product.title,
      orderStatus: order.orderStatus,
      finalPrice: order.finalPrice,
      createdAt: order.createdAt,
    })),
    nextCursor:
      hasMore && lastOrder
        ? encodeCursor({
            createdAt: lastOrder.createdAt,
            id: lastOrder._id.toString(),
          })
        : null,
  };
};

/**
 * 주문 상세 — 소유자 본인만 조회할 수 있다(page 게이트와 별개의 데이터 게이트,
 * docs/security/page-access-control.md).
 */
export const getOwnedOrderDetail = async (
  orderId: string,
  userId: string,
): Promise<OrderDetail> => {
  await dbConnect();

  const order = await requireOwnedOrder(orderId, userId);
  const [item] = await toOrderListItems([order]);

  const payment = order.paymentId
    ? await PaymentModel.findById(order.paymentId).lean()
    : null;

  return {
    order: item,
    payment: payment
      ? {
          status: payment.status,
          payMethod: payment.payMethod,
          requestAmount: payment.requestAmount,
          paidAmount: payment.paidAmount,
          paidAt: payment.paidAt,
          failedAt: payment.failedAt,
          failReason: payment.failReason,
          cancelledAt: payment.cancelledAt,
          cancelAmount: payment.cancelAmount,
          cancelReason: payment.cancelReason,
          receiptUrl: payment.receiptUrl,
          virtualAccount: payment.methodDetail?.virtualAccount,
        }
      : null,
  };
};

const requireOwnedOrder = async (
  orderId: string,
  userId: string,
): Promise<IOrder> => {
  if (!mongoose.isObjectIdOrHexString(orderId)) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }

  const order = await OrderModel.findById(orderId).lean<IOrder>();
  if (!order) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }
  if (order.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인 주문만 조회할 수 있습니다.");
  }

  return order;
};

export const PENDING_ORDER_CANCEL_REASONS = {
  byBuyer: "주문자 취소",
  expired: "결제 미완료로 인한 자동 취소",
} as const;

/**
 * 결제 전 주문(PENDING) 취소 — 결제창을 띄우기 전에 만들어진 주문이라 PortOne이
 * 관여하지 않고 주문 상태만 전이시킨다. 가상계좌가 발급된 PENDING 주문(paymentId
 * 있음)은 이 경로로 취소하지 않는다 — 입금이 이미 진행 중일 수 있어 PortOne 취소를
 * 거쳐야 하고, 그 흐름은 개별 입금기한 만료가 담당한다.
 */
export const cancelPendingOrderForCurrentUser = async (
  orderId: string,
): Promise<void> => {
  await dbConnect();

  const { userId } = await requireAuth();
  const order = await requireOwnedOrder(orderId, userId);

  if (order.orderStatus !== "PENDING") {
    throw new AppError("VALIDATION", "결제 전 주문만 취소할 수 있습니다.");
  }
  // paymentId는 syncPayment가 가상계좌 발급을 확인한 뒤에 붙으므로, 그 확인 전
  // 구간까지 덮으려면 주문의 결제수단 자체도 함께 본다.
  if (order.paymentId || order.payMethod === "VIRTUAL_ACCOUNT") {
    throw new AppError(
      "VALIDATION",
      "가상계좌 입금 대기 주문은 입금기한이 지나면 자동으로 취소됩니다.",
    );
  }

  await OrderModel.updateOne(
    { _id: order._id },
    {
      $set: {
        orderStatus: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: PENDING_ORDER_CANCEL_REASONS.byBuyer,
      },
    },
    { runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "주문 취소에 실패했습니다.",
    );
  });
};

/**
 * 결제창을 벗어난 채 방치된 주문(자동취소 후보)을 조회한다 — paymentId가 없는
 * PENDING만 대상이다. 가상계좌 발급 주문(paymentId 있음)은 입금 대기 중인 정상
 * 주문이므로 제외한다, 여기 끌어들이면 입금받고 주문을 죽이는 결과가 된다.
 * 순수 조회만 담당하고 취소 전 PG 실제 상태 확인은 payment.service의
 * 오케스트레이션이 맡는다(findExpiredAwaitingInvitationOrders와 대칭 — order.service가
 * payment.service를 import하면 순환 의존이 생긴다). 오케스트레이션 쪽이 같은
 * `deadline`으로 취소 대상을 다시 걸러야 하므로 함께 리턴한다.
 */
export const findExpiredPendingOrders = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<{ orders: IOrder[]; deadline: Date }> => {
  await dbConnect();

  const deadline = new Date(
    Date.now() - PENDING_ORDER_EXPIRE_HOURS * 60 * 60 * 1000,
  );

  const orders = await OrderModel.find({
    userId,
    orderStatus: "PENDING",
    paymentId: null,
    // paymentId는 syncPayment가 가상계좌 발급을 확인한 뒤에 붙는다 — 발급 직후
    // 사용자가 창을 닫아 아직 동기화되지 않은 주문까지 덮으려면 결제수단도 본다.
    payMethod: { $ne: "VIRTUAL_ACCOUNT" },
    createdAt: { $lt: deadline },
  }).lean<IOrder[]>();

  return { orders, deadline };
};

/**
 * findExpiredPendingOrders의 전체 유저 스캔 버전 — 스케줄러 배치
 * (/api/cron/expired-orders)가 쓴다. 판정 조건은 동일하고 userId 스코프만 없다.
 * 반환 shape을 per-user와 맞춰(orders + deadline) payment.ts의 공통 취소
 * 실행부가 두 진입점을 그대로 공유한다.
 */
export const findExpiredPendingOrdersForAllUsers = async (): Promise<{
  orders: IOrder[];
  deadline: Date;
}> => {
  await dbConnect();

  const deadline = new Date(
    Date.now() - PENDING_ORDER_EXPIRE_HOURS * 60 * 60 * 1000,
  );

  const orders = await OrderModel.find({
    orderStatus: "PENDING",
    paymentId: null,
    payMethod: { $ne: "VIRTUAL_ACCOUNT" },
    createdAt: { $lt: deadline },
  })
    .sort({ createdAt: 1 })
    .limit(EXPIRED_ORDER_BATCH_LIMIT)
    .lean<IOrder[]>();

  return { orders, deadline };
};
