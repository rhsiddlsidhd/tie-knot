import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import {
  buildOrderInput,
  buildProductInput,
  clearCollections,
} from "@test/support";
import { ProductModel } from "@/models/product.model";
import { OrderModel } from "@/models/order.model";
import { PaymentModel } from "@/models/payment.model";
import { MobileInvitationModel } from "@/models/mobile-invitation.model";
import { createProductService } from "@/services/product";
import { createOrderService } from "@/services/order";
import type * as AuthModule from "@/services/auth";

const { getPaymentMock, cancelPaymentMock } = vi.hoisted(() => ({
  getPaymentMock: vi.fn(),
  cancelPaymentMock: vi.fn(),
}));

vi.mock("@portone/server-sdk", () => {
  class PortOneError extends Error {}
  // 실제 SDK와 동일: RestError extends PortOneError, data를 들고 message는 data.message에서 뽑는다
  class RestError extends PortOneError {
    data: { type: string; message?: string };
    constructor(data: { type: string; message?: string }) {
      super(data.message);
      this.data = data;
    }
  }
  return {
    PortOneClient: () => ({
      payment: { getPayment: getPaymentMock, cancelPayment: cancelPaymentMock },
    }),
    PortOneError,
    RestError,
  };
});

// 세션 조회만 대체한다 — 쿠키/JWT는 이 파일의 검증 대상이 아니고, 나머지 auth 구현은
// 그대로 둔다(partial mock, order.integration.test.ts와 동일 패턴).
const { authState } = vi.hoisted(() => ({ authState: { userId: "" } }));

vi.mock("@/services/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return {
    ...actual,
    requireAuth: async () => ({
      userId: authState.userId,
      email: "buyer@example.com",
      role: "USER",
    }),
  };
});

import { PortOneError, RestError } from "@portone/server-sdk";
import {
  syncPayment,
  cancelPayment,
  cancelExpiredAwaitingMobileInvitationOrders,
  cancelExpiredAwaitingMobileInvitationOrdersForAllUsers,
  cancelExpiredPendingOrders,
  cancelExpiredPendingOrdersForAllUsers,
  completePaymentService,
} from "@/services/payment";

describe("payment", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const setupProductAndOrder = async (quantity: number) => {
    const productInput = buildProductInput({ price: 9900 });
    await createProductService(productInput);
    const savedProduct = await ProductModel.findOne({
      title: productInput.title,
    }).lean();

    const order = await createOrderService(
      buildOrderInput({
        product: {
          productId: savedProduct!._id.toString(),
          title: productInput.title,
          thumbnail: productInput.thumbnail,
          category: savedProduct!.category,
          pricing: { originalPrice: 9900, discountedPrice: 9900 },
          quantity,
          selectedFeatures: [],
        },
      }),
    );

    return { savedProduct: savedProduct!, order };
  };

  const paidPayload = (
    merchantUid: string,
    productId: string,
    amount: number,
  ) => ({
    status: "PAID" as const,
    id: merchantUid,
    customData: JSON.stringify({ productId }),
    amount: { paid: amount },
    orderName: "아무거나",
    transactionId: "txn_1",
    channel: { pgProvider: "TOSSPAYMENTS" },
    pgTxId: "pgtid_1",
    paidAt: new Date().toISOString(),
    receiptUrl: "https://receipt.example.com",
  });

  describe("PAID 상태 처리", () => {
    it("order.product.quantity만큼 salesCount가 증가하고 Order가 CONFIRMED로 전이된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      const result = await syncPayment(order.merchantUid);

      expect(result.success).toBe(true);
      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(2);
    });

    it("Order.confirmedAt이 결제 완료 시점으로 세팅된다(자동취소 기한 계산용)", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      const before = new Date();
      await syncPayment(order.merchantUid);
      const after = new Date();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.confirmedAt).toBeInstanceOf(Date);
      expect(updatedOrder!.confirmedAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(updatedOrder!.confirmedAt!.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("동일 PAID 동기화를 재시도해도 salesCount는 한 번만 증가한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      await syncPayment(order.merchantUid);
      await syncPayment(order.merchantUid);

      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(1);
      expect(
        await PaymentModel.countDocuments({ merchantUid: order.merchantUid }),
      ).toBe(1);
    });

    it("청첩장 발행으로 COMPLETED가 된 주문은 webhook 재전송에도 되돌아가지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { orderStatus: "COMPLETED" } },
      );

      await syncPayment(order.merchantUid);

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("COMPLETED");
      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(1);
    });

    it("금액이 불일치하면 AppError(VALIDATION)를 던지고 salesCount를 증가시키지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice + 1000,
        ),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(0);
    });

    it("customData에 productId가 없으면 검증 실패로 처리한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order.merchantUid, "unused", order.finalPrice),
        customData: JSON.stringify({}),
      });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("customData의 productId에 해당하는 상품이 없으면 검증 실패로 처리한다", async () => {
      const { order } = await setupProductAndOrder(1);
      const missingProductId = new mongoose.Types.ObjectId().toString();
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, missingProductId, order.finalPrice),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("PortOne 응답의 id가 실제 merchantUid와 다르면 주문을 못 찾아 검증 실패로 처리한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          "다른-merchantUid",
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "VALIDATION",
      });
    });

    it("트랜잭션 도중(salesCount 반영 단계) 실패하면 Payment 생성과 Order 상태 전이도 함께 롤백된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      const findByIdAndUpdateSpy = vi
        .spyOn(ProductModel, "findByIdAndUpdate")
        .mockRejectedValueOnce(new Error("의도적 트랜잭션 중단"));

      await expect(syncPayment(order.merchantUid)).rejects.toThrow(
        "의도적 트랜잭션 중단",
      );

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment).toBeNull();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("PENDING");

      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(0);

      findByIdAndUpdateSpy.mockRestore();
    });
  });

  describe("결제수단(payMethod/methodDetail) 매핑", () => {
    it("카드 결제: payMethod=CARD, methodDetail.card에 SDK 필드 그대로 저장된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodCard",
          card: {
            publisher: "kb",
            issuer: "kb",
            brand: "MASTER",
            number: "1234-****-****-5678",
          },
          approvalNumber: "app-1",
          installment: { month: 3, isInterestFree: true },
          pointUsed: false,
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("CARD");
      expect(payment?.methodDetail?.type).toBe("PaymentMethodCard");
      expect(payment?.methodDetail?.card).toMatchObject({
        publisher: "kb",
        number: "1234-****-****-5678",
        approvalNumber: "app-1",
        installment: { month: 3, isInterestFree: true },
        pointUsed: false,
      });
    });

    it("가상계좌: payMethod=VIRTUAL_ACCOUNT, 날짜 필드가 Date로 변환되어 저장된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      const expiredAt = new Date("2026-08-01T00:00:00.000Z").toISOString();
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodVirtualAccount",
          bank: "KOOKMIN",
          accountNumber: "110-1234-5678",
          expiredAt,
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("VIRTUAL_ACCOUNT");
      expect(payment?.methodDetail?.virtualAccount?.accountNumber).toBe(
        "110-1234-5678",
      );
      expect(
        payment?.methodDetail?.virtualAccount?.expiredAt?.toISOString(),
      ).toBe(expiredAt);
    });

    it("계좌이체: payMethod=TRANSFER로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodTransfer",
          bank: "SHINHAN",
          accountNumber: "110-9999",
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("TRANSFER");
      expect(payment?.methodDetail?.transfer?.bank).toBe("SHINHAN");
    });

    it("휴대폰: payMethod=MOBILE로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: { type: "PaymentMethodMobile", phoneNumber: "01000000000" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("MOBILE");
      expect(payment?.methodDetail?.mobile?.phoneNumber).toBe("01000000000");
    });

    it("간편결제: payMethod=EASY_PAY로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodEasyPay",
          provider: "KAKAOPAY",
          easyPayMethod: { type: "CARD" },
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("EASY_PAY");
      expect(payment?.methodDetail?.easyPay?.provider).toBe("KAKAOPAY");
    });

    it("상품권: payMethod=GIFT_CERTIFICATE로 매핑된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodGiftCertificate",
          giftCertificateType: "CULTURELAND",
          approvalNumber: "gc-1",
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBe("GIFT_CERTIFICATE");
      expect(payment?.methodDetail?.giftCertificate?.approvalNumber).toBe(
        "gc-1",
      );
    });

    it("편의점: 우리 PAY_METHOD 6종에 없으므로 payMethod는 비워두고 methodDetail만 기록한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: {
          type: "PaymentMethodConvenienceStore",
          convenienceStoreBrand: "CU",
        },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail?.type).toBe("PaymentMethodConvenienceStore");
    });

    it("인식 불가한 type 값이면 Unrecognized로 폴백해 흔적을 남긴다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
        method: { type: "PaymentMethodFutureThing" },
      });

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail?.type).toBe("Unrecognized");
    });

    it("method 자체가 없으면 payMethod/methodDetail 둘 다 비운다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      await syncPayment(order.merchantUid);

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.payMethod).toBeUndefined();
      expect(payment?.methodDetail).toBeUndefined();
    });
  });

  describe("FAILED 상태 처리", () => {
    it("salesCount를 증가시키지 않고 Order를 CANCELLED로 전이시킨다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(3);
      const failedAt = new Date().toISOString();

      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt,
        failure: { reason: "카드 한도 초과" },
      });

      const result = await syncPayment(order.merchantUid);

      expect(result.success).toBe(false);
      const updatedProduct = await ProductModel.findById(
        savedProduct._id,
      ).lean();
      expect(updatedProduct?.salesCount).toBe(0);

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.cancelReason).toBe("카드 한도 초과");
      expect(updatedOrder?.cancelledAt?.toISOString()).toBe(failedAt);
    });

    it("이미 Payment 문서가 있으면 새로 만들지 않고 갱신한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt: new Date().toISOString(),
        failure: { reason: "카드 한도 초과" },
      });

      await syncPayment(order.merchantUid);
      const result = await syncPayment(order.merchantUid);

      expect(result).toMatchObject({
        success: false,
        message: "카드 한도 초과",
      });
    });

    it("트랜잭션 도중(Order 상태 전이 단계) 실패하면 이미 생성된 Payment도 함께 롤백된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "FAILED",
        id: order.merchantUid,
        failedAt: new Date().toISOString(),
        failure: { reason: "카드 한도 초과" },
      });
      const saveSpy = vi
        .spyOn(OrderModel.prototype, "save")
        .mockRejectedValueOnce(new Error("의도적 트랜잭션 중단"));

      await expect(syncPayment(order.merchantUid)).rejects.toThrow(
        "의도적 트랜잭션 중단",
      );

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment).toBeNull();

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("PENDING");

      saveSpy.mockRestore();
    });
  });

  describe("webhook 취소 상태 처리", () => {
    it("PAID 이후 CANCELLED 동기화는 Payment/Order를 취소하고 판매 수량을 한 번만 되돌린다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);

      const cancelledAt = new Date().toISOString();
      getPaymentMock.mockResolvedValue({
        status: "CANCELLED",
        id: order.merchantUid,
        transactionId: "txn_1",
        cancelledAt,
        amount: { paid: order.finalPrice, cancelled: order.finalPrice },
        cancellations: [
          {
            status: "SUCCEEDED",
            totalAmount: order.finalPrice,
            reason: "고객 요청",
            cancelledAt,
          },
        ],
      });

      await syncPayment(order.merchantUid);
      await syncPayment(order.merchantUid);

      expect(
        await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean(),
      ).toMatchObject({
        status: "CANCELLED",
        cancelAmount: order.finalPrice,
        cancelReason: "고객 요청",
      });
      expect(await OrderModel.findById(order._id).lean()).toMatchObject({
        orderStatus: "CANCELLED",
        cancelReason: "고객 요청",
      });
      expect(
        (await ProductModel.findById(savedProduct._id).lean())?.salesCount,
      ).toBe(0);
    });

    it("발행완료(COMPLETED)된 주문을 환불해도 salesCount가 차감된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { orderStatus: "COMPLETED" } },
      );

      const cancelledAt = new Date().toISOString();
      getPaymentMock.mockResolvedValue({
        status: "CANCELLED",
        id: order.merchantUid,
        transactionId: "txn_1",
        cancelledAt,
        amount: { paid: order.finalPrice, cancelled: order.finalPrice },
        cancellations: [
          {
            status: "SUCCEEDED",
            totalAmount: order.finalPrice,
            reason: "고객 요청",
            cancelledAt,
          },
        ],
      });

      await syncPayment(order.merchantUid);

      expect(
        (await ProductModel.findById(savedProduct._id).lean())?.salesCount,
      ).toBe(0);
      expect(
        (await OrderModel.findById(order._id).lean())?.orderStatus,
      ).toBe("CANCELLED");
    });

    it("PARTIAL_CANCELLED는 Payment에 취소 합계를 기록하고 Order는 CONFIRMED로 유지한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(2);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);

      const cancelledAt = new Date().toISOString();
      getPaymentMock.mockResolvedValue({
        status: "PARTIAL_CANCELLED",
        id: order.merchantUid,
        transactionId: "txn_1",
        cancelledAt,
        amount: { paid: order.finalPrice, cancelled: 1000 },
        cancellations: [
          {
            status: "SUCCEEDED",
            totalAmount: 1000,
            reason: "부분 환불",
            cancelledAt,
          },
        ],
      });

      await syncPayment(order.merchantUid);

      expect(
        await PaymentModel.findOne({ merchantUid: order.merchantUid }).lean(),
      ).toMatchObject({
        status: "PARTIAL_CANCELLED",
        cancelAmount: 1000,
        cancelReason: "부분 환불",
      });
      expect((await OrderModel.findById(order._id).lean())?.orderStatus).toBe(
        "CONFIRMED",
      );
      expect(
        (await ProductModel.findById(savedProduct._id).lean())?.salesCount,
      ).toBe(2);
    });
  });

  describe("VIRTUAL_ACCOUNT_ISSUED 상태 처리", () => {
    const virtualAccountPayload = (merchantUid: string) => ({
      status: "VIRTUAL_ACCOUNT_ISSUED" as const,
      id: merchantUid,
      transactionId: "txn_va_1",
      channel: { pgProvider: "TOSSPAYMENTS" },
      pgTxId: "pgtid_va_1",
      method: {
        type: "PaymentMethodVirtualAccount" as const,
        bank: "SHINHAN",
        accountNumber: "110-123-456789",
        accountType: "FIXED",
        remitteeName: "타이노트",
        expiredAt: "2026-08-25T14:59:59.000Z",
        issuedAt: "2026-08-19T05:00:00.000Z",
      },
    });

    it("가상계좌 발급을 PENDING Payment로 저장하고 주문에 연결한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(virtualAccountPayload(order.merchantUid));

      const result = await syncPayment(order.merchantUid);

      expect(result.status).toBe("PENDING");
      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.status).toBe("PENDING");
      expect(payment?.payMethod).toBe("VIRTUAL_ACCOUNT");
      expect(payment?.methodDetail?.virtualAccount?.accountNumber).toBe(
        "110-123-456789",
      );

      // 주문은 아직 입금 전이라 PENDING 그대로지만, 결제를 참조해 방치 주문과 구분된다.
      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("PENDING");
      expect(updatedOrder?.paymentId?.toString()).toBe(payment!._id.toString());
    });

    it("같은 발급 webhook이 재전송돼도 Payment는 하나만 유지된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(virtualAccountPayload(order.merchantUid));

      await syncPayment(order.merchantUid);
      await syncPayment(order.merchantUid);

      expect(
        await PaymentModel.countDocuments({ merchantUid: order.merchantUid }),
      ).toBe(1);
    });
  });

  describe("그 외 상태 처리", () => {
    it("주문을 찾을 수 없으면 AppError(NOT_FOUND)를 던진다", async () => {
      getPaymentMock.mockResolvedValue({ status: "READY" });

      await expect(
        syncPayment("존재하지-않는-merchantUid"),
      ).rejects.toMatchObject({
        category: "NOT_FOUND",
      });
    });

    it("PAID/FAILED가 아니면 매핑된 상태로 결제 대기를 리턴한다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "READY",
        id: order.merchantUid,
      });

      const result = await syncPayment(order.merchantUid);

      expect(result).toEqual({ success: false, status: "PENDING" });
    });

    it("알 수 없는 상태 문자열이면 EXTERNAL_SERVICE 에러가 전파된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: "ALIEN_STATUS",
        id: order.merchantUid,
      });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });
    });

    it("상태값이 문자열이 아니면 EXTERNAL_SERVICE 에러가 전파된다", async () => {
      const { order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        status: 12345,
        id: order.merchantUid,
      });

      await expect(syncPayment(order.merchantUid)).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });
    });

    it("PortOne SDK 자체 오류면 AppError(EXTERNAL_SERVICE)로 감싼다", async () => {
      const { order } = await setupProductAndOrder(1);
      // 실제 PortOneError는 abstract class라 직접 new할 수 없다 — 이 파일에서는
      // @portone/server-sdk 전체를 mock했으므로(위 vi.mock) concrete 클래스로
      // 대체됐지만, import 시점의 타입은 실제 .d.ts(abstract) 기준이라 캐스팅한다.
      const PortOneErrorCtor = PortOneError as unknown as new (
        message: string,
      ) => Error;
      getPaymentMock.mockRejectedValue(
        new PortOneErrorCtor("포트원 서버 오류"),
      );

      const error = await syncPayment(order.merchantUid).catch((e) => e);

      expect(error).toMatchObject({ category: "EXTERNAL_SERVICE" });
      // RestError가 아닌 PortOneError는 type을 알 수 없다 — UNKNOWN 폴백.
      expect(error.message).toContain("type=UNKNOWN");
      expect(error.message).toContain(order.merchantUid);
    });

    it("RestError(UNAUTHORIZED, message 없음)면 type과 merchantUid가 로그에 남고 빈 message는 폴백 문구로 대체된다", async () => {
      const { order } = await setupProductAndOrder(1);
      const RestErrorCtor = RestError as unknown as new (data: {
        type: string;
        message?: string;
      }) => Error;
      getPaymentMock.mockRejectedValue(
        new RestErrorCtor({ type: "UNAUTHORIZED" }),
      );

      const error = await syncPayment(order.merchantUid).catch((e) => e);

      expect(error).toMatchObject({ category: "EXTERNAL_SERVICE" });
      expect(error.message).toContain("type=UNAUTHORIZED");
      expect(error.message).toContain(order.merchantUid);
      expect(error.message).toContain("(SDK 메시지 없음)");
    });

    it("RestError(PAYMENT_NOT_FOUND, message 있음)면 SDK 원문 메시지가 그대로 남는다", async () => {
      const { order } = await setupProductAndOrder(1);
      const RestErrorCtor = RestError as unknown as new (data: {
        type: string;
        message?: string;
      }) => Error;
      getPaymentMock.mockRejectedValue(
        new RestErrorCtor({
          type: "PAYMENT_NOT_FOUND",
          message: "결제 건을 찾을 수 없습니다",
        }),
      );

      const error = await syncPayment(order.merchantUid).catch((e) => e);

      expect(error).toMatchObject({ category: "EXTERNAL_SERVICE" });
      expect(error.message).toContain("type=PAYMENT_NOT_FOUND");
      expect(error.message).toContain("결제 건을 찾을 수 없습니다");
      expect(error.message).not.toContain("(SDK 메시지 없음)");
    });
  });

  describe("cancelPayment", () => {
    it("정상 취소: Order/Payment가 CANCELLED로 전이된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);

      cancelPaymentMock.mockResolvedValue({
        cancellation: {
          status: "SUCCEEDED",
          totalAmount: order.finalPrice,
          cancelledAt: new Date().toISOString(),
        },
      });

      await cancelPayment(order.merchantUid, "정보 미입력으로 인한 자동 취소");

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CANCELLED");
      expect(updatedOrder?.cancelReason).toBe("정보 미입력으로 인한 자동 취소");

      const payment = await PaymentModel.findOne({
        merchantUid: order.merchantUid,
      }).lean();
      expect(payment?.status).toBe("CANCELLED");
      expect(payment?.cancelAmount).toBe(order.finalPrice);
    });

    it("주문을 찾을 수 없으면 NOT_FOUND를 던진다", async () => {
      await expect(
        cancelPayment("존재하지-않는-merchantUid", "사유"),
      ).rejects.toMatchObject({
        category: "NOT_FOUND",
      });
    });

    it("PortOne 취소가 FAILED면 EXTERNAL_SERVICE를 던지고 상태를 바꾸지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);

      cancelPaymentMock.mockResolvedValue({
        cancellation: { status: "FAILED" },
      });

      await expect(
        cancelPayment(order.merchantUid, "사유"),
      ).rejects.toMatchObject({
        category: "EXTERNAL_SERVICE",
      });

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CONFIRMED");
    });

    it("PortOne 취소 API가 RestError(UNAUTHORIZED)를 던지면 type과 merchantUid가 로그에 남고 상태를 바꾸지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);

      const RestErrorCtor = RestError as unknown as new (data: {
        type: string;
        message?: string;
      }) => Error;
      cancelPaymentMock.mockRejectedValue(
        new RestErrorCtor({ type: "UNAUTHORIZED" }),
      );

      const error = await cancelPayment(order.merchantUid, "사유").catch(
        (e) => e,
      );

      expect(error).toMatchObject({ category: "EXTERNAL_SERVICE" });
      expect(error.message).toContain("type=UNAUTHORIZED");
      expect(error.message).toContain(order.merchantUid);

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CONFIRMED");
    });
  });

  describe("cancelExpiredAwaitingMobileInvitationOrders", () => {
    const expireConfirmedAt = async (orderId: mongoose.Types.ObjectId) => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: orderId },
        { confirmedAt: eightDaysAgo },
      );
    };

    it("기한(7일) 초과 + MobileInvitation 없는 CONFIRMED 주문을 자동취소한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);
      await expireConfirmedAt(order._id);

      cancelPaymentMock.mockResolvedValue({
        cancellation: {
          status: "SUCCEEDED",
          totalAmount: order.finalPrice,
          cancelledAt: new Date().toISOString(),
        },
      });

      await cancelExpiredAwaitingMobileInvitationOrders(order.userId.toString());

      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CANCELLED");
    });

    it("기한이 안 지났으면 건드리지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );
      await syncPayment(order.merchantUid);
      await cancelExpiredAwaitingMobileInvitationOrders(order.userId.toString());

      expect(cancelPaymentMock).not.toHaveBeenCalled();
      const updatedOrder = await OrderModel.findById(order._id).lean();
      expect(updatedOrder?.orderStatus).toBe("CONFIRMED");
    });

    it("한 주문의 취소 실패가 같은 유저의 다른 만료 주문 처리를 막지 않는다", async () => {
      const { savedProduct, order: order1 } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order1.merchantUid,
          savedProduct._id.toString(),
          order1.finalPrice,
        ),
      );
      await syncPayment(order1.merchantUid);
      await expireConfirmedAt(order1._id);

      const { savedProduct: savedProduct2, order: order2 } =
        await setupProductAndOrder(1);
      await OrderModel.updateOne(
        { _id: order2._id },
        { userId: order1.userId },
      );
      getPaymentMock.mockResolvedValue({
        ...paidPayload(
          order2.merchantUid,
          savedProduct2._id.toString(),
          order2.finalPrice,
        ),
        transactionId: "txn_2",
      });
      await syncPayment(order2.merchantUid);
      await expireConfirmedAt(order2._id);

      cancelPaymentMock.mockImplementation(
        ({ paymentId }: { paymentId: string }) => {
          if (paymentId === order1.merchantUid) {
            return Promise.reject(new Error("PG 일시 오류"));
          }
          return Promise.resolve({
            cancellation: {
              status: "SUCCEEDED",
              totalAmount: order2.finalPrice,
              cancelledAt: new Date().toISOString(),
            },
          });
        },
      );

      await expect(
        cancelExpiredAwaitingMobileInvitationOrders(order1.userId.toString()),
      ).resolves.toBeUndefined();

      const updatedOrder1 = await OrderModel.findById(order1._id).lean();
      const updatedOrder2 = await OrderModel.findById(order2._id).lean();
      expect(updatedOrder1?.orderStatus).toBe("CONFIRMED");
      expect(updatedOrder2?.orderStatus).toBe("CANCELLED");
    });
  });

  describe("cancelExpiredAwaitingMobileInvitationOrdersForAllUsers", () => {
    const expireConfirmedAt = async (orderId: mongoose.Types.ObjectId) => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: orderId },
        { confirmedAt: eightDaysAgo },
      );
    };

    // setupProductAndOrder를 조작 없이 두 번 호출하면 buildOrderInput 기본값이 매번
    // 새 ObjectId를 발급하므로 이미 서로 다른 유저다 — per-user 테스트처럼 userId를
    // 맞춰줄 필요가 없다.
    it("서로 다른 유저의 만료건을 모두 환불취소하고 집계를 반환한다", async () => {
      const { savedProduct: product1, order: order1 } =
        await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order1.merchantUid, product1._id.toString(), order1.finalPrice),
      );
      await syncPayment(order1.merchantUid);
      await expireConfirmedAt(order1._id);

      const { savedProduct: product2, order: order2 } =
        await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order2.merchantUid, product2._id.toString(), order2.finalPrice),
        transactionId: "txn_2",
      });
      await syncPayment(order2.merchantUid);
      await expireConfirmedAt(order2._id);

      cancelPaymentMock.mockResolvedValue({
        cancellation: {
          status: "SUCCEEDED",
          totalAmount: order1.finalPrice,
          cancelledAt: new Date().toISOString(),
        },
      });

      const result = await cancelExpiredAwaitingMobileInvitationOrdersForAllUsers();

      expect(result).toEqual({ scanned: 2, cancelled: 2, failed: 0 });
      const updated1 = await OrderModel.findById(order1._id).lean();
      const updated2 = await OrderModel.findById(order2._id).lean();
      expect(updated1?.orderStatus).toBe("CANCELLED");
      expect(updated2?.orderStatus).toBe("CANCELLED");
    });

    it("MobileInvitation이 있는 주문은 cancelPayment를 호출하지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);
      await expireConfirmedAt(order._id);
      await MobileInvitationModel.create({
        publicKey: "batch-test-invitation-key",
        userId: new mongoose.Types.ObjectId(order.userId),
        orderId: order._id,
        productId: order.product.productId,
        status: "draft",
        groom: { name: "신랑", phone: "010-1111-2222" },
        bride: { name: "신부", phone: "010-3333-4444" },
        weddingDate: new Date("2026-12-25T13:00:00"),
        venue: "예식장",
        address: "서울시 강남구",
        addressDetail: "3층",
        guestbookEnabled: true,
        thumbnailImages: [],
        galleryImages: [],
      });

      const result = await cancelExpiredAwaitingMobileInvitationOrdersForAllUsers();

      expect(result).toEqual({ scanned: 0, cancelled: 0, failed: 0 });
      expect(cancelPaymentMock).not.toHaveBeenCalled();
    });

    it("기한이 안 지난 주문은 건드리지 않는다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );
      await syncPayment(order.merchantUid);

      const result = await cancelExpiredAwaitingMobileInvitationOrdersForAllUsers();

      expect(result).toEqual({ scanned: 0, cancelled: 0, failed: 0 });
      expect(cancelPaymentMock).not.toHaveBeenCalled();
    });

    it("한 주문의 PortOne 취소 실패가 다른 유저 주문 처리를 막지 않는다", async () => {
      const { savedProduct: product1, order: order1 } =
        await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue(
        paidPayload(order1.merchantUid, product1._id.toString(), order1.finalPrice),
      );
      await syncPayment(order1.merchantUid);
      await expireConfirmedAt(order1._id);

      const { savedProduct: product2, order: order2 } =
        await setupProductAndOrder(1);
      getPaymentMock.mockResolvedValue({
        ...paidPayload(order2.merchantUid, product2._id.toString(), order2.finalPrice),
        transactionId: "txn_2",
      });
      await syncPayment(order2.merchantUid);
      await expireConfirmedAt(order2._id);

      cancelPaymentMock.mockImplementation(
        ({ paymentId }: { paymentId: string }) => {
          if (paymentId === order1.merchantUid) {
            return Promise.reject(new Error("PG 일시 오류"));
          }
          return Promise.resolve({
            cancellation: {
              status: "SUCCEEDED",
              totalAmount: order2.finalPrice,
              cancelledAt: new Date().toISOString(),
            },
          });
        },
      );

      const result = await cancelExpiredAwaitingMobileInvitationOrdersForAllUsers();

      expect(result).toEqual({ scanned: 2, cancelled: 1, failed: 1 });
      const updated1 = await OrderModel.findById(order1._id).lean();
      const updated2 = await OrderModel.findById(order2._id).lean();
      expect(updated1?.orderStatus).toBe("CONFIRMED");
      expect(updated2?.orderStatus).toBe("CANCELLED");
    });

    it("후보가 없으면 cancelPaymentMock을 호출하지 않는다", async () => {
      const result = await cancelExpiredAwaitingMobileInvitationOrdersForAllUsers();

      expect(result).toEqual({ scanned: 0, cancelled: 0, failed: 0 });
      expect(cancelPaymentMock).not.toHaveBeenCalled();
    });
  });

  describe("cancelExpiredPendingOrders", () => {
    // order.ts에서 payment.ts로 이관되면서(GH #78, 취소 전 PG 확인 추가) 여기로
    // 옮겨온 기존 테스트들 — 이관 전엔 PortOne을 아예 호출하지 않았지만, 이제는
    // 후보로 걸리는 케이스마다 getPaymentMock을 명시적으로 세팅해야 한다.
    const setCreatedAt = async (
      orderId: mongoose.Types.ObjectId,
      createdAt: Date,
    ) => {
      await OrderModel.updateOne(
        { _id: orderId },
        { $set: { createdAt } },
        { timestamps: false, overwriteImmutable: true },
      );
    };

    it("24시간이 지났고 PortOne에 한 번도 제출 안 된(조회 자체가 실패하는) 주문은 자동취소한다", async () => {
      const { order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      // 실제 PortOneError는 abstract class라 직접 new할 수 없다(위 "PortOne SDK 자체
      // 오류" 테스트와 동일한 이유로 캐스팅).
      const PortOneErrorCtor = PortOneError as unknown as new (
        message: string,
      ) => Error;
      getPaymentMock.mockRejectedValue(new PortOneErrorCtor("no such payment"));

      await cancelExpiredPendingOrders(order.userId.toString());

      const updated = await OrderModel.findById(order._id).lean();
      expect(updated?.orderStatus).toBe("CANCELLED");
      expect(updated?.cancelReason).toBe("결제 미완료로 인한 자동 취소");
    });

    it("가상계좌가 발급된 주문(paymentId 있음)은 기한이 지나도 만료 대상이 아니다", async () => {
      const { order } = await setupProductAndOrder(1);
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { paymentId: new mongoose.Types.ObjectId() } },
      );
      await setCreatedAt(order._id, new Date(Date.now() - 72 * 60 * 60 * 1000));

      await cancelExpiredPendingOrders(order.userId.toString());

      expect(getPaymentMock).not.toHaveBeenCalled();
      const untouched = await OrderModel.findById(order._id).lean();
      expect(untouched?.orderStatus).toBe("PENDING");
    });

    it("아직 24시간이 안 지난 주문은 PG 조회 없이 그대로 둔다", async () => {
      const { order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 23 * 60 * 60 * 1000));

      await cancelExpiredPendingOrders(order.userId.toString());

      expect(getPaymentMock).not.toHaveBeenCalled();
      const untouched = await OrderModel.findById(order._id).lean();
      expect(untouched?.orderStatus).toBe("PENDING");
    });

    // ── GH #78 Part B 결함 수정 검증 — "동기화 후에도 PENDING이면 무조건 취소"였던
    // 최초 설계는 PG상 PAID인데 검증/트랜잭션만 실패한 주문까지 취소해버려 이슈
    // 원래 버그(PAID 주문 오취소)를 재현했다. outcome 기반 필터링으로 고정한다.
    it("만료됐지만 PG상 PAID였던 주문은 취소하지 않고 CONFIRMED로 동기화한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      await cancelExpiredPendingOrders(order.userId.toString());

      const updated = await OrderModel.findById(order._id).lean();
      expect(updated?.orderStatus).toBe("CONFIRMED");
      expect(updated?.cancelReason).toBeUndefined();
    });

    it("만료됐고 실제로 미결제(READY)인 주문은 그대로 취소된다", async () => {
      const { order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      getPaymentMock.mockResolvedValue({ status: "READY", id: order.merchantUid });

      await cancelExpiredPendingOrders(order.userId.toString());

      const updated = await OrderModel.findById(order._id).lean();
      expect(updated?.orderStatus).toBe("CANCELLED");
      expect(updated?.cancelReason).toBe("결제 미완료로 인한 자동 취소");
    });

    it("PG상 PAID인데 검증 실패(VALIDATION)로 동기화가 실패하면 취소하지 않고 PENDING을 유지한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      // 금액 불일치 → syncPayment가 AppError(VALIDATION)를 던진다(위 "PAID 상태
      // 처리" 스위트의 동일 케이스 참고) — EXTERNAL_SERVICE가 아니므로 취소
      // 후보에서 빠져야 한다.
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice + 1000,
        ),
      );

      await cancelExpiredPendingOrders(order.userId.toString());

      const untouched = await OrderModel.findById(order._id).lean();
      expect(untouched?.orderStatus).toBe("PENDING");
      expect(untouched?.cancelReason).toBeUndefined();
    });

    it("한 후보의 동기화 실패가 같은 유저의 다른 만료 후보 처리를 막지 않는다", async () => {
      const { savedProduct, order: order1 } = await setupProductAndOrder(1);
      await setCreatedAt(order1._id, new Date(Date.now() - 25 * 60 * 60 * 1000));

      const { order: order2 } = await setupProductAndOrder(1);
      await OrderModel.updateOne(
        { _id: order2._id },
        { userId: order1.userId },
      );
      await setCreatedAt(order2._id, new Date(Date.now() - 25 * 60 * 60 * 1000));

      getPaymentMock.mockImplementation(({ paymentId }: { paymentId: string }) => {
        if (paymentId === order1.merchantUid) {
          // PG상 PAID인데 검증 실패 — 취소 보류 대상(취소되면 안 됨)
          return Promise.resolve(
            paidPayload(
              order1.merchantUid,
              savedProduct._id.toString(),
              order1.finalPrice + 1000,
            ),
          );
        }
        // 진짜 미결제 — 취소 대상
        return Promise.resolve({ status: "READY", id: order2.merchantUid });
      });

      await expect(
        cancelExpiredPendingOrders(order1.userId.toString()),
      ).resolves.toBeUndefined();

      const updatedOrder1 = await OrderModel.findById(order1._id).lean();
      const updatedOrder2 = await OrderModel.findById(order2._id).lean();
      expect(updatedOrder1?.orderStatus).toBe("PENDING");
      expect(updatedOrder2?.orderStatus).toBe("CANCELLED");
    });
  });

  describe("cancelExpiredPendingOrdersForAllUsers", () => {
    const setCreatedAt = async (
      orderId: mongoose.Types.ObjectId,
      createdAt: Date,
    ) => {
      await OrderModel.updateOne(
        { _id: orderId },
        { $set: { createdAt } },
        { timestamps: false, overwriteImmutable: true },
      );
    };

    it("서로 다른 유저의 만료건을 모두 취소하고 집계를 반환한다", async () => {
      const { order: order1 } = await setupProductAndOrder(1);
      await setCreatedAt(order1._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      const { order: order2 } = await setupProductAndOrder(1);
      await setCreatedAt(order2._id, new Date(Date.now() - 30 * 60 * 60 * 1000));
      getPaymentMock.mockResolvedValue({ status: "READY", id: "irrelevant" });

      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 2,
        cancelled: 2,
        syncedToConfirmed: 0,
        heldForReview: 0,
      });
      const updated1 = await OrderModel.findById(order1._id).lean();
      const updated2 = await OrderModel.findById(order2._id).lean();
      expect(updated1?.orderStatus).toBe("CANCELLED");
      expect(updated2?.orderStatus).toBe("CANCELLED");
    });

    it("24시간이 안 지난 다른 유저 주문은 PG 조회 없이 그대로 둔다", async () => {
      const { order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 23 * 60 * 60 * 1000));

      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 0,
        cancelled: 0,
        syncedToConfirmed: 0,
        heldForReview: 0,
      });
      expect(getPaymentMock).not.toHaveBeenCalled();
      const untouched = await OrderModel.findById(order._id).lean();
      expect(untouched?.orderStatus).toBe("PENDING");
    });

    it("가상계좌 발급 주문은 유저와 무관하게 제외된다", async () => {
      const { order } = await setupProductAndOrder(1);
      await OrderModel.updateOne(
        { _id: order._id },
        { $set: { paymentId: new mongoose.Types.ObjectId() } },
      );
      await setCreatedAt(order._id, new Date(Date.now() - 72 * 60 * 60 * 1000));

      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 0,
        cancelled: 0,
        syncedToConfirmed: 0,
        heldForReview: 0,
      });
      expect(getPaymentMock).not.toHaveBeenCalled();
    });

    it("PG상 PAID였던 주문은 취소 대신 동기화되고 syncedToConfirmed로 집계된다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      await setCreatedAt(order._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      getPaymentMock.mockResolvedValue(
        paidPayload(order.merchantUid, savedProduct._id.toString(), order.finalPrice),
      );

      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 1,
        cancelled: 0,
        syncedToConfirmed: 1,
        heldForReview: 0,
      });
      const updated = await OrderModel.findById(order._id).lean();
      expect(updated?.orderStatus).toBe("CONFIRMED");
    });

    it("한 유저의 동기화 실패가 다른 유저 주문 취소를 막지 않는다", async () => {
      const { savedProduct, order: order1 } = await setupProductAndOrder(1);
      await setCreatedAt(order1._id, new Date(Date.now() - 25 * 60 * 60 * 1000));
      const { order: order2 } = await setupProductAndOrder(1);
      await setCreatedAt(order2._id, new Date(Date.now() - 25 * 60 * 60 * 1000));

      getPaymentMock.mockImplementation(({ paymentId }: { paymentId: string }) => {
        if (paymentId === order1.merchantUid) {
          // PG상 PAID인데 검증 실패 — 취소 보류 대상(취소되면 안 됨)
          return Promise.resolve(
            paidPayload(order1.merchantUid, savedProduct._id.toString(), order1.finalPrice + 1000),
          );
        }
        return Promise.resolve({ status: "READY", id: order2.merchantUid });
      });

      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 2,
        cancelled: 1,
        syncedToConfirmed: 0,
        heldForReview: 1,
      });
      const updatedOrder1 = await OrderModel.findById(order1._id).lean();
      const updatedOrder2 = await OrderModel.findById(order2._id).lean();
      expect(updatedOrder1?.orderStatus).toBe("PENDING");
      expect(updatedOrder2?.orderStatus).toBe("CANCELLED");
    });

    it("후보가 없으면 PortOne을 호출하지 않는다", async () => {
      const result = await cancelExpiredPendingOrdersForAllUsers();

      expect(result).toEqual({
        scanned: 0,
        cancelled: 0,
        syncedToConfirmed: 0,
        heldForReview: 0,
      });
      expect(getPaymentMock).not.toHaveBeenCalled();
    });
  });

  describe("completePaymentService", () => {
    it("본인 소유 주문이면 PG 상태를 동기화하고 결과를 리턴한다", async () => {
      const { savedProduct, order } = await setupProductAndOrder(1);
      authState.userId = order.userId.toString();
      getPaymentMock.mockResolvedValue(
        paidPayload(
          order.merchantUid,
          savedProduct._id.toString(),
          order.finalPrice,
        ),
      );

      const status = await completePaymentService(order.merchantUid);

      expect(status).toBe("PAID");
    });

    it("다른 유저의 merchantUid로 호출하면 FORBIDDEN을 던지고 PortOne을 조회하지 않는다", async () => {
      const { order } = await setupProductAndOrder(1);
      authState.userId = new mongoose.Types.ObjectId().toString();

      await expect(
        completePaymentService(order.merchantUid),
      ).rejects.toMatchObject({ category: "FORBIDDEN" });
      expect(getPaymentMock).not.toHaveBeenCalled();
    });

    it("존재하지 않는 merchantUid면 NOT_FOUND를 던진다", async () => {
      authState.userId = new mongoose.Types.ObjectId().toString();

      await expect(
        completePaymentService("no-such-merchant-uid"),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
      expect(getPaymentMock).not.toHaveBeenCalled();
    });
  });
});
