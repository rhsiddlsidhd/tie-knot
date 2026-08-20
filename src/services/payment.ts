import "server-only";
import mongoose from "mongoose";
import * as PortOne from "@portone/server-sdk";
import type {
  PayStatus,
  PayMethod,
  PaymentMethodDetail,
  IPayment,
} from "@/models";
import { PaymentModel, OrderModel, ProductModel } from "@/models";

import { getProductService } from "./product";
import {
  getOrderSeviceByMerchantUid,
  findExpiredAwaitingInvitationOrders,
  findExpiredPendingOrders,
  PENDING_ORDER_CANCEL_REASONS,
} from "./order";
import { AppError } from "@/core/domain";
import { dbConnect } from "@/db";
import { requireAuth } from "./auth";

// 환경 변수 확인
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;

if (!PORTONE_API_SECRET) {
  throw new Error("PORTONE_API_SECRET is not defined");
}

// 포트원 클라이언트 설정
const portone = PortOne.PortOneClient({
  secret: PORTONE_API_SECRET,
  baseUrl: process.env.PORTONE_API_BASE_URL,
});

// 타입 정의: 결제 조회 결과
type GetPaymentResult = Awaited<ReturnType<typeof portone.payment.getPayment>>;
type PaidPayment = Extract<GetPaymentResult, { status: "PAID" }>;
type FailedPayment = Extract<GetPaymentResult, { status: "FAILED" }>;
type VirtualAccountIssuedPayment = Extract<
  GetPaymentResult,
  { status: "VIRTUAL_ACCOUNT_ISSUED" }
>;
type CancelledPayment = Extract<
  GetPaymentResult,
  { status: "CANCELLED" | "PARTIAL_CANCELLED" }
>;

/**
 * 결제 반영이 이미 끝난 주문 상태 — CONFIRMED에서 청첩장 발행으로 COMPLETED까지
 * 나아간 주문도 "결제는 이미 반영됨"이다. 여기서 COMPLETED를 빠뜨리면 webhook
 * 재전송이 발행된 주문을 CONFIRMED로 되돌리고 salesCount를 중복 증가시킨다.
 */
const isPaymentAppliedStatus = (orderStatus: string): boolean =>
  orderStatus === "CONFIRMED" || orderStatus === "COMPLETED";

/**
 * PortOne 결제 상태를 시스템 상태로 매핑
 * - 알 수 없는 상태는 에러를 던져 즉시 감지
 * - 결제는 민감한 영역이므로 silent failure 방지
 */
function mapPortOneStatus(status: unknown): PayStatus {
  if (typeof status !== "string") {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `유효하지 않은 결제 상태 타입: ${typeof status}`,
    );
  }

  const statusMap: Record<string, PayStatus> = {
    READY: "PENDING",
    VIRTUAL_ACCOUNT_ISSUED: "PENDING",
    PAID: "PAID",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    PARTIAL_CANCELLED: "PARTIAL_CANCELLED",
  };

  if (!(status in statusMap)) {
    throw new AppError("EXTERNAL_SERVICE", `알 수 없는 결제 상태: ${status}`);
  }

  return statusMap[status];
}

type SdkPaymentMethod = NonNullable<PaidPayment["method"]>;

/**
 * PortOne 결제수단(discriminated union)을 시스템 payMethod/methodDetail로 매핑
 * - 우리 PAY_METHOD 6종에 없는 편의점(PaymentMethodConvenienceStore)은 payMethod
 *   없이 methodDetail만 기록한다. 채널 미지원으로 판매수단 자체는 제외했지만,
 *   응답 원문 보존은 계속한다.
 * - 미인식 값은 Unrecognized로 폴백해 methodDetail에 흔적을 남긴다(silent
 *   failure 방지 — mapPortOneStatus와 같은 원칙).
 */
function mapPortOnePaymentMethod(method: SdkPaymentMethod | undefined): {
  payMethod?: PayMethod;
  methodDetail?: PaymentMethodDetail;
} {
  if (!method) return {};

  switch (method.type) {
    case "PaymentMethodCard":
      return {
        payMethod: "CARD",
        methodDetail: {
          type: "PaymentMethodCard",
          card: {
            ...method.card,
            approvalNumber: method.approvalNumber,
            installment: method.installment,
            pointUsed: method.pointUsed,
          },
        },
      };
    case "PaymentMethodVirtualAccount":
      return {
        payMethod: "VIRTUAL_ACCOUNT",
        methodDetail: {
          type: "PaymentMethodVirtualAccount",
          virtualAccount: {
            bank: method.bank,
            accountNumber: method.accountNumber,
            accountType: method.accountType,
            remitteeName: method.remitteeName,
            remitterName: method.remitterName,
            expiredAt: method.expiredAt
              ? new Date(method.expiredAt)
              : undefined,
            issuedAt: method.issuedAt ? new Date(method.issuedAt) : undefined,
            refundStatus: method.refundStatus,
          },
        },
      };
    case "PaymentMethodTransfer":
      return {
        payMethod: "TRANSFER",
        methodDetail: {
          type: "PaymentMethodTransfer",
          transfer: { bank: method.bank, accountNumber: method.accountNumber },
        },
      };
    case "PaymentMethodMobile":
      return {
        payMethod: "MOBILE",
        methodDetail: {
          type: "PaymentMethodMobile",
          mobile: { phoneNumber: method.phoneNumber },
        },
      };
    case "PaymentMethodEasyPay":
      return {
        payMethod: "EASY_PAY",
        methodDetail: {
          type: "PaymentMethodEasyPay",
          easyPay: {
            provider: method.provider,
            easyPayMethod: method.easyPayMethod,
          },
        },
      };
    case "PaymentMethodGiftCertificate":
      return {
        payMethod: "GIFT_CERTIFICATE",
        methodDetail: {
          type: "PaymentMethodGiftCertificate",
          giftCertificate: {
            giftCertificateType: method.giftCertificateType,
            approvalNumber: method.approvalNumber,
          },
        },
      };
    case "PaymentMethodConvenienceStore":
      return {
        methodDetail: {
          type: "PaymentMethodConvenienceStore",
          convenienceStore: {
            convenienceStoreBrand: method.convenienceStoreBrand,
            confirmationNumber: method.confirmationNumber,
            receiptNumber: method.receiptNumber,
            paymentDeadline: method.paymentDeadline
              ? new Date(method.paymentDeadline)
              : undefined,
          },
        },
      };
    default:
      return { methodDetail: { type: "Unrecognized" } };
  }
}

/**
 * 결제 데이터 검증 (위변조 방지)
 */
async function verifyPayment(payment: PaidPayment): Promise<boolean> {
  try {
    // 1. customData 존재 확인 및 파싱
    if (!payment.customData) {
      console.error("[verifyPayment] customData is missing");
      return false;
    }

    const parsed = JSON.parse(payment.customData);
    const { productId } = parsed;

    if (!productId) {
      console.error("[verifyPayment] productId is missing in customData");
      return false;
    }

    // 2. DB에서 주문 및 상품 정보 병렬 조회
    const [product, order] = await Promise.all([
      getProductService(productId),
      getOrderSeviceByMerchantUid(payment.id), // payment.id는 우리가 보낸 merchantUid
    ]);

    if (!product) {
      console.error("[verifyPayment] Product not found:", productId);
      return false;
    }

    if (!order) {
      console.error("[verifyPayment] Order not found:", payment.id);
      return false;
    }

    // 3. 실제 결제된 금액 vs DB 주문 금액 비교
    const isAmountMatch = payment.amount.paid === order.finalPrice;

    if (!isAmountMatch) {
      console.error(
        `[verifyPayment] Amount mismatch: expected ${order.finalPrice}, got ${payment.amount.paid}`,
      );
      return false;
    }

    // 4. 상품명 비교 (선택사항이지만 보안 강화)
    const expectedOrderName = `${product.title} 모바일 청첩장`;
    const isTitleMatch = payment.orderName === expectedOrderName;

    if (!isTitleMatch) {
      console.warn(
        `[verifyPayment] Title mismatch: expected "${expectedOrderName}", got "${payment.orderName}"`,
      );
      // 상품명 불일치는 경고만 하고 통과시킴 (금액이 맞으면 OK)
    }

    return isAmountMatch;
  } catch (e) {
    console.error("[verifyPayment] Error:", e);
    return false;
  }
}

/**
 * PortOne 결제 정보 동기화 및 검증
 * @param paymentId - merchantUid (주문번호)
 */
export const syncPayment = async (paymentId: string) => {
  await dbConnect();

  try {
    // 1. 포트원 서버에서 최신 결제 상태 조회
    const actualPayment: GetPaymentResult = await portone.payment.getPayment({
      paymentId,
    });

    // 2. merchantUid로 Order 찾기
    const order = await OrderModel.findOne({ merchantUid: paymentId });

    if (!order) {
      throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
    }

    // 3. 결제가 완료(PAID)된 경우에만 검증 및 DB 반영
    if (actualPayment.status === "PAID") {
      const isValid = await verifyPayment(actualPayment as PaidPayment);

      if (!isValid) {
        throw new AppError(
          "VALIDATION",
          "결제 검증에 실패했습니다. 금액 불일치 또는 데이터 오류",
        );
      }

      // 4~6. Payment 저장 + Order 상태 전이 + Product salesCount 증가는 하나의
      // 논리적 단위라 트랜잭션으로 묶는다 — 중간에 하나라도 실패하면 전부
      // 롤백된다(services/AGENTS.md "트랜잭션" 섹션 참고).
      let payment!: mongoose.HydratedDocument<IPayment>;

      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({
          merchantUid: paymentId,
        }).session(session);
        const alreadyApplied =
          existing?.status === "PAID" && isPaymentAppliedStatus(order.orderStatus);

        const { payMethod, methodDetail } = mapPortOnePaymentMethod(
          actualPayment.method,
        );

        const paymentData = {
          merchantUid: paymentId,
          impUid: actualPayment.transactionId,
          orderId: order._id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          buyerTel: order.buyerPhone,
          requestAmount: order.finalPrice,
          paidAmount: actualPayment.amount.paid,
          status: mapPortOneStatus(actualPayment.status),
          payMethod,
          methodDetail,
          pgProvider: actualPayment.channel?.pgProvider,
          pgTid: actualPayment.pgTxId,
          paidAt: new Date(actualPayment.paidAt),
          receiptUrl: actualPayment.receiptUrl,
        };

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        // PortOne webhook은 성공 응답을 받지 못하면 같은 결제를 재전송한다.
        // 이미 PAID/CONFIRMED로 반영된 결제는 Payment 원문만 최신화하고 주문 시각과
        // 판매량을 다시 적용하지 않는다.
        if (alreadyApplied) return;

        // 5. Order 상태 업데이트
        order.orderStatus = "CONFIRMED";
        order.paymentId = payment._id;
        order.confirmedAt = new Date();
        await order.save({ session });

        // 6. 판매 수량 반영 — "판매 건수"가 아니라 quantity 합산 기준(수량 개념 있는
        // 상품군 확장 대비, 지금은 quantity가 거의 항상 1).
        await ProductModel.findByIdAndUpdate(
          order.product.productId,
          { $inc: { salesCount: order.product.quantity } },
          { session, runValidators: true },
        );
      });

      return {
        success: true,
        status: payment.status,
        payment: payment.toObject(),
      };
    }

    // 6. 결제 실패 시 처리 — Payment 저장 + Order 상태 전이도 하나의 논리적
    // 단위라 트랜잭션으로 묶는다(PAID 분기와 같은 이유).
    if (actualPayment.status === "FAILED") {
      const failedPayment = actualPayment as FailedPayment;

      let payment!: mongoose.HydratedDocument<IPayment>;

      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({
          merchantUid: paymentId,
        }).session(session);

        const { payMethod, methodDetail } = mapPortOnePaymentMethod(
          failedPayment.method,
        );

        const paymentData = {
          merchantUid: paymentId,
          orderId: order._id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          buyerTel: order.buyerPhone,
          requestAmount: order.finalPrice,
          status: mapPortOneStatus(actualPayment.status),
          payMethod,
          methodDetail,
          failedAt: new Date(failedPayment.failedAt),
          failReason: failedPayment.failure?.reason,
        };

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        // Order 상태 업데이트 — 취소 사유는 지금 유일하게 존재하는 취소 경로(결제
        // 실패에 의한 시스템 자동 취소)에서 이미 확보돼 있는 값을 그대로 옮긴다
        // (관리자 수동 취소/사용자 요청 취소는 아직 그 자체가 없어 대상 아님).
        order.orderStatus = "CANCELLED";
        order.cancelledAt = new Date(failedPayment.failedAt);
        order.cancelReason = failedPayment.failure?.reason;
        await order.save({ session });
      });

      return {
        success: false,
        status: payment.status,
        message: failedPayment.failure?.reason || "결제 실패",
      };
    }

    if (
      actualPayment.status === "CANCELLED" ||
      actualPayment.status === "PARTIAL_CANCELLED"
    ) {
      const cancelledPayment = actualPayment as CancelledPayment;
      const succeeded = cancelledPayment.cancellations.filter(
        (cancellation) => cancellation.status === "SUCCEEDED",
      );
      const latest = succeeded.at(-1);
      const cancelAmount = succeeded.reduce(
        (total, cancellation) => total + cancellation.totalAmount,
        0,
      );
      const cancelledAt = new Date(
        latest?.cancelledAt ?? cancelledPayment.cancelledAt,
      );

      let payment!: mongoose.HydratedDocument<IPayment>;
      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({
          merchantUid: paymentId,
        }).session(session);
        const wasFullyApplied =
          existing?.status === "PAID" && isPaymentAppliedStatus(order.orderStatus);
        const paymentData = {
          merchantUid: paymentId,
          impUid: cancelledPayment.transactionId,
          orderId: order._id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          buyerTel: order.buyerPhone,
          requestAmount: order.finalPrice,
          paidAmount: cancelledPayment.amount.paid,
          status: mapPortOneStatus(cancelledPayment.status),
          cancelledAt,
          cancelAmount,
          cancelReason: latest?.reason,
        };

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        if (cancelledPayment.status === "CANCELLED") {
          order.orderStatus = "CANCELLED";
          order.cancelledAt = cancelledAt;
          order.cancelReason = latest?.reason;
          await order.save({ session });
          if (wasFullyApplied) {
            await ProductModel.findByIdAndUpdate(
              order.product.productId,
              { $inc: { salesCount: -order.product.quantity } },
              { session, runValidators: true },
            );
          }
        }
      });

      return {
        success: false,
        status: payment.status,
        payment: payment.toObject(),
      };
    }

    // 가상계좌 발급 — 아직 입금 전이지만 계좌번호·입금기한을 사용자에게 안내해야 하고,
    // 주문이 결제를 참조해야 "결제창을 벗어난 방치 주문"과 구분돼 자동취소 대상에서
    // 빠진다(findExpiredPendingOrders의 쿼리 필터, order.service). Payment 저장 + Order 참조
    // 연결은 하나의 논리적 단위라 트랜잭션으로 묶는다(PAID 분기와 같은 이유).
    if (actualPayment.status === "VIRTUAL_ACCOUNT_ISSUED") {
      const issuedPayment = actualPayment as VirtualAccountIssuedPayment;

      let payment!: mongoose.HydratedDocument<IPayment>;

      await mongoose.connection.transaction(async (session) => {
        const existing = await PaymentModel.findOne({
          merchantUid: paymentId,
        }).session(session);

        const { payMethod, methodDetail } = mapPortOnePaymentMethod(
          issuedPayment.method,
        );

        const paymentData = {
          merchantUid: paymentId,
          impUid: issuedPayment.transactionId,
          orderId: order._id,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          buyerTel: order.buyerPhone,
          requestAmount: order.finalPrice,
          status: mapPortOneStatus(issuedPayment.status),
          payMethod,
          methodDetail,
          pgProvider: issuedPayment.channel?.pgProvider,
          pgTid: issuedPayment.pgTxId,
        };

        if (!existing) {
          [payment] = await PaymentModel.create([paymentData], { session });
        } else {
          Object.assign(existing, paymentData);
          payment = await existing.save({ session });
        }

        // 이 분기는 webhook 재전송으로 여러 번 들어올 수 있다 — 주문 상태는 건드리지
        // 않고(입금 전이라 PENDING 그대로다) 결제 참조만 한 번 연결한다.
        if (!order.paymentId) {
          order.paymentId = payment._id;
          await order.save({ session });
        }
      });

      return {
        success: false,
        status: payment.status,
        payment: payment.toObject(),
      };
    }

    // 결제 대기 중
    return { success: false, status: mapPortOneStatus(actualPayment.status) };
  } catch (e) {
    if (e instanceof PortOne.PortOneError) {
      throw new AppError("EXTERNAL_SERVICE", `포트원 오류: ${e.message}`);
    }
    if (e instanceof AppError) {
      throw e;
    }
    // mongoose 자체 에러(ValidationError 등)를 포함해 분류 안 된 예외는 전부 AppError로 감싼다
    // — services는 AppError 하나로 통일한다(docs/architecture/error-handling.md 에러 표현 규칙).
    throw new AppError(
      "INTERNAL",
      e instanceof Error ? e.message : "결제 동기화에 실패했습니다.",
    );
  }
};

/**
 * 결제 취소 — PortOne 환불 API 호출 후 Order/Payment 상태를 트랜잭션으로
 * 함께 전이한다(syncPayment의 FAILED 분기와 같은 이유). coupleInfo 미입력
 * 자동취소(order.service의 findExpiredAwaitingInvitationOrders)에서 사용.
 * @param merchantUid - 우리 서버에서 생성한 주문번호(PortOne paymentId)
 */
export const cancelPayment = async (
  merchantUid: string,
  reason: string,
): Promise<void> => {
  await dbConnect();

  const order = await OrderModel.findOne({ merchantUid });

  if (!order) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }

  try {
    const result = await portone.payment.cancelPayment({
      paymentId: merchantUid,
      reason,
      requester: "ADMIN",
    });

    if (result.cancellation.status === "FAILED") {
      throw new AppError(
        "EXTERNAL_SERVICE",
        "포트원 결제 취소에 실패했습니다.",
      );
    }

    const cancelledAt =
      "cancelledAt" in result.cancellation && result.cancellation.cancelledAt
        ? new Date(result.cancellation.cancelledAt)
        : new Date();
    const cancelAmount =
      "totalAmount" in result.cancellation
        ? result.cancellation.totalAmount
        : undefined;

    await mongoose.connection.transaction(async (session) => {
      await PaymentModel.updateOne(
        { merchantUid },
        {
          status: "CANCELLED",
          cancelledAt,
          cancelAmount,
          cancelReason: reason,
        },
        { session, runValidators: true },
      );

      order.orderStatus = "CANCELLED";
      order.cancelledAt = cancelledAt;
      order.cancelReason = reason;
      await order.save({ session });
    });
  } catch (e) {
    if (e instanceof PortOne.PortOneError) {
      throw new AppError("EXTERNAL_SERVICE", `포트원 취소 오류: ${e.message}`);
    }
    if (e instanceof AppError) {
      throw e;
    }
    throw new AppError(
      "INTERNAL",
      e instanceof Error ? e.message : "결제 취소에 실패했습니다.",
    );
  }
};

/**
 * coupleInfo 미입력 자동취소 오케스트레이션 — cron 인프라가 없어 my-orders
 * 목록 조회 직전에 호출하는 lazy-check 방식을 쓴다. 개별 주문 취소 실패가 다른 주문 처리를
 * 막지 않도록 서로 격리한다(로깅 후 계속 진행 — silent swallow 아님).
 */
export const cancelExpiredAwaitingInvitationOrders = async (
  userId: string,
): Promise<void> => {
  const expiredOrders = await findExpiredAwaitingInvitationOrders(userId);

  await Promise.all(
    expiredOrders.map((order) =>
      cancelPayment(order.merchantUid, "정보 미입력으로 인한 자동 취소").catch(
        (e) => {
          console.error(
            `[cancelExpiredAwaitingInvitationOrders] ${order.merchantUid} 취소 실패:`,
            e,
          );
        },
      ),
    ),
  );
};

/**
 * 결제창을 벗어난 채 방치된 주문의 자동취소 — 취소 전 PG 실제 상태를 먼저
 * 확인한다(PAID인데 DB 동기화만 실패한 주문을 시간만 보고 잘못 취소하는 회귀
 * 방지, GH #78). order.service의 findExpiredPendingOrders(순수 조회)와 결합하는
 * 오케스트레이션 — cancelExpiredAwaitingInvitationOrders와 같은 이유로 여기 위치.
 *
 * syncPayment가 실패해도 이유에 따라 취소 여부를 가른다 — PG 쪽 조회 자체가 안
 * 되는 경우(AppError EXTERNAL_SERVICE, "한 번도 PortOne에 제출 안 된 merchantUid"의
 * 실제 시그널)만 "확인 결과 미결제"로 취급해 취소 후보에 남긴다. PG는 PAID인데
 * verifyPayment 검증(VALIDATION)이나 트랜잭션(INTERNAL)만 실패한 경우까지 취소해
 * 버리면 이슈의 원래 버그(PAID 주문 오취소)를 그대로 재현하게 되므로, 이 경우는
 * 취소하지 않고 PENDING으로 남겨 수동 검토 대상으로 뺀다. 개별 주문 동기화 실패가
 * 다른 주문 처리를 막지 않도록 격리한다(cancelExpiredAwaitingInvitationOrders와 동일).
 */
export const cancelExpiredPendingOrders = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<void> => {
  const { orders: candidates, deadline } =
    await findExpiredPendingOrders(userId);
  if (candidates.length === 0) return;

  const outcomes = await Promise.allSettled(
    candidates.map((order) => syncPayment(order.merchantUid)),
  );

  const cancelableIds = candidates
    .filter((order, i) => {
      const outcome = outcomes[i];
      // PAID였다면 syncPayment가 이미 CONFIRMED로 전이시켰다 — 아래 updateMany의
      // orderStatus:"PENDING" 조건에서 자연히 제외된다.
      if (outcome.status === "fulfilled") return true;

      const reason = outcome.reason;
      if (reason instanceof AppError && reason.category === "EXTERNAL_SERVICE") {
        return true;
      }

      console.error(
        `[cancelExpiredPendingOrders] ${order.merchantUid} 동기화 실패(취소 보류, 수동 검토 필요):`,
        reason,
      );
      return false;
    })
    .map((order) => order._id);

  if (cancelableIds.length === 0) return;

  await OrderModel.updateMany(
    {
      _id: { $in: cancelableIds },
      orderStatus: "PENDING",
      paymentId: null,
      payMethod: { $ne: "VIRTUAL_ACCOUNT" },
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

export async function completePaymentService(
  paymentId: string,
): Promise<PayStatus> {
  const { userId } = await requireAuth();
  if (!paymentId) {
    throw new AppError("VALIDATION", "올바르지 않은 요청입니다.");
  }

  // completePayment 액션은 이제 방금 자신이 만든 merchantUid뿐 아니라
  // PaymentButton(다른 세션에서 만들어진 주문 목록)에서 넘어온 merchantUid로도
  // 호출된다 — 소유권을 세션에서 다시 조회해 대조한다(src/actions/AGENTS.md).
  // syncPayment 자체에는 이 체크를 넣지 않는다 — webhook(세션 없음)과
  // cancelExpiredPendingOrders(이미 userId로 스코프됨)가 세션 없이 직접 호출한다.
  const order = await getOrderSeviceByMerchantUid(paymentId);
  if (!order) {
    throw new AppError("NOT_FOUND", "주문을 찾을 수 없습니다.");
  }
  if (order.userId.toString() !== userId) {
    throw new AppError("FORBIDDEN", "본인 주문만 결제 확인할 수 있습니다.");
  }

  const payment = await syncPayment(paymentId);
  if (!payment) {
    throw new AppError("INTERNAL", "결제 동기화에 실패했습니다.");
  }
  return payment.status;
}
