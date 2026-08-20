import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderJSON } from "@/core/domain";

const { pushMock, setOrderMock, setResumePaymentMock, completePaymentMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    setOrderMock: vi.fn(),
    setResumePaymentMock: vi.fn(),
    completePaymentMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/ui/stores", () => ({
  useOrderStore: (
    selector: (s: {
      setOrder: (item: unknown) => void;
      setResumePayment: (data: unknown) => void;
    }) => unknown,
  ) => selector({ setOrder: setOrderMock, setResumePayment: setResumePaymentMock }),
}));

vi.mock("@/actions", () => ({ completePayment: completePaymentMock }));

import { PaymentButton } from "./PaymentButton";

const buildOrder = (): OrderJSON =>
  ({
    _id: "order-1",
    merchantUid: "order-merchant-1",
    userId: "user-1",
    buyerName: "홍길동",
    buyerEmail: "buyer@example.com",
    buyerPhone: "01000000000",
    payMethod: "CARD",
    finalPrice: 9000,
    product: {
      productId: "product-1",
      title: "봄맞이 청첩장",
      thumbnail: "https://example.com/thumb.jpg",
      pricing: { originalPrice: 10000, discountedPrice: 9000 },
      quantity: 1,
      selectedFeatures: [],
    },
  }) as unknown as OrderJSON;

describe("PaymentButton (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PG 확인 결과 이미 PAID면 결제 페이지로 가지 않고 주문 상세로 이동한다", async () => {
    completePaymentMock.mockResolvedValue({
      success: true,
      data: { status: "PAID" },
    });
    const user = userEvent.setup();
    render(<PaymentButton order={buildOrder()} />);

    await user.click(screen.getByRole("button", { name: /결제하기/ }));

    expect(completePaymentMock).toHaveBeenCalledWith("order-merchant-1");
    expect(pushMock).toHaveBeenCalledWith("/my-orders/order-1");
    expect(setOrderMock).not.toHaveBeenCalled();
  });

  it("PG 확인 결과 미결제면 기존 merchantUid로 재결제 상태를 세팅하고 결제 페이지로 이동한다", async () => {
    completePaymentMock.mockResolvedValue({
      success: true,
      data: { status: "FAILED" },
    });
    const user = userEvent.setup();
    render(<PaymentButton order={buildOrder()} />);

    await user.click(screen.getByRole("button", { name: /결제하기/ }));

    expect(setOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "product-1" }),
    );
    expect(setResumePaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ merchantUid: "order-merchant-1" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/payment");
  });

  it("PortOne 조회 자체가 실패해도(EXTERNAL_SERVICE) 재결제로 진행한다", async () => {
    completePaymentMock.mockResolvedValue({
      success: false,
      error: { category: "EXTERNAL_SERVICE", message: "포트원 오류" },
    });
    const user = userEvent.setup();
    render(<PaymentButton order={buildOrder()} />);

    await user.click(screen.getByRole("button", { name: /결제하기/ }));

    expect(setResumePaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ merchantUid: "order-merchant-1" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/payment");
  });
});
