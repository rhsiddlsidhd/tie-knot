import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/adapters/browser/daum", () => ({
  useDaumPopup: () => ({ address: "", handleDaumAddressPopup: vi.fn() }),
}));

import { CheckoutForm } from "./CheckoutForm";

const baseProps = {
  loading: false,
  paymentStatus: "IDLE" as const,
  agreed: false,
  onAgreedChange: vi.fn(),
  errorMessage: null as string | null,
  errors: {},
  shippingErrors: {},
  pending: false,
  onSubmit: vi.fn(),
};

describe("CheckoutForm (organism)", () => {
  it("실물 상품 주문이면 배송 카드를 2번으로 보여주고 결제수단은 3번이 된다", () => {
    render(<CheckoutForm {...baseProps} requiresShipping />);

    expect(screen.getByText("배송 정보")).toBeInTheDocument();
    const headings = screen.getAllByText(/^[123]$/);
    expect(headings.map((el) => el.textContent)).toEqual(["1", "2", "3"]);
  });

  it("모바일초대장 주문이면 배송 카드가 없고 결제수단이 2번으로 당겨진다", () => {
    render(<CheckoutForm {...baseProps} requiresShipping={false} />);

    expect(screen.queryByText("배송 정보")).not.toBeInTheDocument();
    const headings = screen.getAllByText(/^[12]$/);
    expect(headings.map((el) => el.textContent)).toEqual(["1", "2"]);
  });
});
