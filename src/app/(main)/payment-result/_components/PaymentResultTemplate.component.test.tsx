import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentResultTemplate } from "./PaymentResultTemplate";

describe("PaymentResultTemplate", () => {
  it("errorMessage가 없으면 결제 확인 중 안내를 보여준다", () => {
    render(<PaymentResultTemplate errorMessage={null} />);

    expect(screen.getByText("결제를 확인하고 있습니다")).toBeInTheDocument();
    expect(
      screen.getByText("페이지를 닫지 말고 잠시만 기다려 주세요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "주문 내역 확인" }),
    ).not.toBeInTheDocument();
  });

  it("errorMessage가 있으면 실패 안내와 주문 내역 확인 링크를 보여준다", () => {
    render(<PaymentResultTemplate errorMessage="결제 처리에 실패했습니다." />);

    expect(screen.getByText("결제 확인에 실패했습니다")).toBeInTheDocument();
    expect(screen.getByText("결제 처리에 실패했습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "주문 내역 확인" }),
    ).toHaveAttribute("href", "/my-orders");
    expect(
      screen.queryByText("결제를 확인하고 있습니다"),
    ).not.toBeInTheDocument();
  });
});
