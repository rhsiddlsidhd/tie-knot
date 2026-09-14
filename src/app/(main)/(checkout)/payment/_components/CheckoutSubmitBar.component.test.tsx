import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutSubmitBar } from "./CheckoutSubmitBar";

describe("CheckoutSubmitBar", () => {
  it("기본 상태에서는 결제하기 버튼을 보여준다", () => {
    render(
      <CheckoutSubmitBar disabled={false} pending={false} paymentStatus="IDLE" />,
    );

    expect(screen.getByRole("button", { name: /결제하기/ })).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("disabled가 true면 버튼이 비활성화된다", () => {
    render(
      <CheckoutSubmitBar disabled={true} pending={false} paymentStatus="IDLE" />,
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("pending이 true면 주문 처리 중 문구를 보여준다", () => {
    render(
      <CheckoutSubmitBar disabled={false} pending={true} paymentStatus="IDLE" />,
    );

    expect(screen.getByText("주문 처리 중...")).toBeInTheDocument();
  });

  it("paymentStatus가 PENDING이면 결제 진행 중 문구를 보여준다", () => {
    render(
      <CheckoutSubmitBar disabled={false} pending={false} paymentStatus="PENDING" />,
    );

    expect(screen.getByText("결제 진행 중...")).toBeInTheDocument();
  });
});
