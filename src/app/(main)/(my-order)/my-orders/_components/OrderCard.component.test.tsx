import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OrderListItem } from "@/core/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/ui/stores", () => ({
  useOrderStore: (
    selector: (s: { setOrder: (item: unknown) => void }) => unknown,
  ) => selector({ setOrder: vi.fn() }),
}));

vi.mock("@/actions/cancelOrder", () => ({
  cancelOrder: vi.fn(),
}));

import { OrderCard } from "./OrderCard";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";

const buildOrder = (overrides?: Partial<OrderListItem>): OrderListItem =>
  ({
    _id: "order-1",
    merchantUid: "ORDER-1",
    userId: "user-1",
    buyerName: "김철수",
    buyerEmail: "buyer@example.com",
    buyerPhone: "010-1234-5678",
    finalPrice: 9000,
    discountRate: 0,
    discountAmount: 0,
    payMethod: "CARD",
    orderStatus: "PENDING",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    product: {
      productId: "product-1",
      category: MOBILE_INVITATION_CATEGORY,
      title: "봄맞이 청첩장",
      thumbnail: "https://example.com/thumb.jpg",
      pricing: { originalPrice: 10000, discountedPrice: 9000 },
      quantity: 1,
      selectedFeatures: [],
    },
    ...overrides,
  }) as unknown as OrderListItem;

describe("OrderCard", () => {
  it("결제창을 벗어난 PENDING 주문은 결제하기 버튼을 보여준다", () => {
    render(<OrderCard order={buildOrder()} />);

    expect(
      screen.getByRole("button", { name: "결제하기" }),
    ).toBeInTheDocument();
    expect(screen.getByText("주문대기")).toBeInTheDocument();
  });

  it("가상계좌가 발급된 PENDING 주문은 결제하기 대신 입금 안내를 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          paymentId: "payment-1",
          payMethod: "VIRTUAL_ACCOUNT",
          virtualAccount: {
            bank: "신한은행",
            accountNumber: "110-123-456789",
            expiredAt: new Date("2026-08-03T23:59:00.000Z"),
          },
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: "결제하기" })).toBeNull();
    expect(screen.getByText("입금대기")).toBeInTheDocument();
    expect(screen.getByText(/110-123-456789/)).toBeInTheDocument();
    expect(screen.getByText(/입금액 9,000원/)).toBeInTheDocument();
  });

  it("가상계좌 주문은 결제 동기화 전(paymentId 없음)에도 결제하기를 숨긴다", () => {
    render(
      <OrderCard order={buildOrder({ payMethod: "VIRTUAL_ACCOUNT" })} />,
    );

    expect(screen.queryByRole("button", { name: "결제하기" })).toBeNull();
    expect(screen.getByText("입금대기")).toBeInTheDocument();
  });

  it("취소된 주문은 취소 사유와 시각을 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          orderStatus: "CANCELLED",
          cancelledAt: new Date("2026-08-02T09:30:00.000Z"),
          cancelReason: "결제 미완료로 인한 자동 취소",
        })}
      />,
    );

    expect(
      screen.getByText(/결제 미완료로 인한 자동 취소/),
    ).toBeInTheDocument();
  });

  it("발행된 청첩장이 있으면 공개 링크 복사 버튼을 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          orderStatus: "COMPLETED",
          invitationStatus: "published",
          invitationPublicKey: "public-key-1",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: /공개 링크 복사/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("발행완료")).toBeInTheDocument();
  });
});
