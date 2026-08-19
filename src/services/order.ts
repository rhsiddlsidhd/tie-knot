import "server-only";
import mongoose from "mongoose";
import type { IOrder, OrderJSON } from "@/models";
import { InvitationModel, OrderModel, ProductModel } from "@/models";
import type { CreateOrderDto } from "@/core/schemas";
import { generateUid } from "@/core/utils";
import { dbConnect } from "@/db";
import { AppError } from "@/core/domain";
import { INVITATION_INPUT_DEADLINE_DAYS } from "@/core/domain";
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

export const getOrdersByUserId = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<OrderJSON[]> => {
  await dbConnect();

  const orders = await OrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean<IOrder[]>();

  // .lean() 결과의 ObjectId 필드를 명시적으로 문자열화한다(services/AGENTS.md
  // 컨벤션) — Server Component(my-orders/page.tsx)가 Client Component로 그대로
  // 넘기므로, ObjectId 인스턴스가 하나라도 남으면 "Only plain objects..." 에러가 난다.
  const productIds = [
    ...new Set(orders.map((order) => order.product.productId.toString())),
  ];
  const [products, invitations] = await Promise.all([
    ProductModel.find({ _id: { $in: productIds } })
      .select("category")
      .lean(),
    InvitationModel.find({ userId }).select("orderId status").lean(),
  ]);
  const categories = new Map(
    products.map((product) => [product._id.toString(), product.category]),
  );
  const invitationStatuses = new Map(
    invitations.map((invitation) => [
      invitation.orderId.toString(),
      invitation.status,
    ]),
  );

  return orders.map((order) => ({
    ...order,
    _id: order._id.toString(),
    invitationStatus: invitationStatuses.get(order._id.toString()),
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
  }));
};
