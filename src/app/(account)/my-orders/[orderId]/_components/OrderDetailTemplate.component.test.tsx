import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OrderDetail } from "@/core/domain/order";
import type { PayStatus } from "@/core/domain/payment";
import { OrderDetailTemplate } from "./OrderDetailTemplate";

const order: OrderDetail["order"] = {
  _id: "order-1",
  merchantUid: "merchant-1",
  userId: "user-1",
  buyerName: "홍길동",
  buyerEmail: "buyer@example.com",
  buyerPhone: "010-1234-5678",
  product: {
    productId: "product-1",
    title: "테스트 상품",
    thumbnail: "https://example.com/product.jpg",
    pricing: { originalPrice: 10_000, discountedPrice: 9_000 },
    quantity: 1,
    selectedFeatures: [],
  },
  finalPrice: 9_000,
  discountRate: 0.1,
  discountAmount: 1_000,
  payMethod: "CARD",
  orderStatus: "PENDING",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  review: null,
};

const PAYMENT_STATUS_CASES = [
  ["PENDING", "입금대기"],
  ["PAID", "결제완료"],
  ["FAILED", "결제실패"],
  ["CANCELLED", "결제취소"],
  ["PARTIAL_CANCELLED", "부분취소"],
  ["REFUNDED", "환불완료"],
] as const satisfies readonly (readonly [PayStatus, string])[];

describe("OrderDetailTemplate", () => {
  it.each(PAYMENT_STATUS_CASES)(
    "%s 결제 상태를 사용자용 라벨로 보여준다",
    (status, label) => {
      render(
        <OrderDetailTemplate
          order={order}
          payment={{ status, requestAmount: 9_000 }}
        />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );
});
