import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const {
  completePaymentMock,
  replaceMock,
  clearOrderMock,
  setPaymentStatusMock,
} = vi.hoisted(() => ({
  completePaymentMock: vi.fn(),
  replaceMock: vi.fn(),
  clearOrderMock: vi.fn(),
  setPaymentStatusMock: vi.fn(),
}));

vi.mock("@/actions/completePayment", () => ({
  completePayment: completePaymentMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/ui/stores", () => ({
  useOrderStore: (
    selector: (state: {
      clearOrder: typeof clearOrderMock;
      setPaymentStatus: typeof setPaymentStatusMock;
    }) => unknown,
  ) =>
    selector({
      clearOrder: clearOrderMock,
      setPaymentStatus: setPaymentStatusMock,
    }),
}));

import { PaymentResult } from "./PaymentResult";

describe("PaymentResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("paymentId로 결제를 완료하고 성공 페이지로 이동한다", async () => {
    completePaymentMock.mockResolvedValue({
      success: true,
      data: { status: "PAID" },
    });

    render(<PaymentResult paymentId="ORDER-1" />);

    expect(screen.getByText("결제를 확인하고 있습니다")).toBeInTheDocument();
    await waitFor(() => {
      expect(completePaymentMock).toHaveBeenCalledTimes(1);
      expect(completePaymentMock).toHaveBeenCalledWith("ORDER-1");
      expect(setPaymentStatusMock).toHaveBeenCalledWith("PAID");
      expect(clearOrderMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith(
        "/payment/success?orderId=ORDER-1",
      );
    });
  });

  it("결제 완료가 실패하면 서버의 안전한 오류 메시지를 표시한다", async () => {
    completePaymentMock.mockResolvedValue({
      success: false,
      error: {
        category: "EXTERNAL_SERVICE",
        message: "결제 처리에 실패했습니다.",
      },
    });

    render(<PaymentResult paymentId="ORDER-1" />);

    expect(
      await screen.findByText("결제 처리에 실패했습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "주문 내역 확인" }),
    ).toHaveAttribute("href", "/my-orders");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("paymentId가 없으면 결제 완료를 호출하지 않고 오류를 표시한다", () => {
    render(<PaymentResult />);

    expect(
      screen.getByText("결제 정보가 올바르지 않습니다."),
    ).toBeInTheDocument();
    expect(completePaymentMock).not.toHaveBeenCalled();
  });
});
