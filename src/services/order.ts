import "server-only";
import mongoose from "mongoose";
import type { IOrder } from "@/models";
import {
  InvitationModel,
  OrderModel,
  PaymentModel,
  ProductModel,
} from "@/models";
import type { CreateOrderDto } from "@/core/schemas";
import { encodeCursor, decodeCursor, generateUid } from "@/core/utils";
import { dbConnect } from "@/db";
import type {
  OrderDetail,
  OrderListItem,
  OrderListPage,
  OrderStatus,
  ProductCategory,
} from "@/core/domain";
import { AppError } from "@/core/domain";
import {
  INVITATION_INPUT_DEADLINE_DAYS,
  ORDER_PAGE_SIZE,
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

  const [products, invitations, payments] = await Promise.all([
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
  if (order.paymentId) {
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
 * 결제창을 벗어난 채 방치된 주문의 자동취소 — paymentId가 없는 PENDING만 대상이다.
 * 가상계좌 발급 주문(paymentId 있음)은 입금 대기 중인 정상 주문이므로 제외한다,
 * 여기 끌어들이면 입금받고 주문을 죽이는 결과가 된다. 결제 전 주문이라 PortOne
 * 환불이 필요 없어 DB 상태 전이만 한다.
 */
export const cancelExpiredPendingOrders = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<void> => {
  await dbConnect();

  const deadline = new Date(
    Date.now() - PENDING_ORDER_EXPIRE_HOURS * 60 * 60 * 1000,
  );

  await OrderModel.updateMany(
    {
      userId,
      orderStatus: "PENDING",
      paymentId: null,
      createdAt: { $lt: deadline },
    },
    {
      $set: {
        orderStatus: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: PENDING_ORDER_CANCEL_REASONS.expired,
      },
    },
    { runValidators: true },
  ).catch((err) => {
    throw new AppError(
      "INTERNAL",
      err instanceof Error ? err.message : "만료 주문 취소에 실패했습니다.",
    );
  });
};
