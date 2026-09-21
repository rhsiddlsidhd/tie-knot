import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CreateOrderResult } from "@/actions/createOrder";
import { RetryPaymentCard } from "./RetryPaymentCard";

const order: CreateOrderResult = {
  merchantUid: "merchant-1",
  finalPrice: 50000,
  payMethod: "CARD",
  buyerName: "홍길동",
  buyerEmail: "a@b.com",
  buyerPhone: "010-1234-5678",
  title: "모바일 청첩장",
  userId: "user-1",
  productId: "product-1",
  message: "",
};

describe("RetryPaymentCard", () => {
  it("결제 금액을 포함한 재결제 버튼을 렌더링한다", () => {
    render(
      <RetryPaymentCard
        order={order}
        paymentStatus="IDLE"
        errorMessage={null}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "50,000원 재결제하기" }),
    ).toBeInTheDocument();
  });

  it("버튼을 클릭하면 onConfirm을 호출한다", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <RetryPaymentCard
        order={order}
        paymentStatus="IDLE"
        errorMessage={null}
        onConfirm={onConfirm}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "50,000원 재결제하기" }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("errorMessage가 있으면 오류 안내를 보여준다", () => {
    render(
      <RetryPaymentCard
        order={order}
        paymentStatus="IDLE"
        errorMessage="결제에 실패했습니다."
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("오류가 발생했습니다")).toBeInTheDocument();
    expect(screen.getByText("결제에 실패했습니다.")).toBeInTheDocument();
  });

  it("paymentStatus가 PENDING이면 버튼이 비활성화되고 진행 중 오버레이와 문구를 보여준다", () => {
    render(
      <RetryPaymentCard
        order={order}
        paymentStatus="PENDING"
        errorMessage={null}
        onConfirm={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "결제 진행 중..." });
    expect(button).toBeDisabled();
    expect(screen.getByText("잠시만 기다려주세요.")).toBeInTheDocument();
  });
});
