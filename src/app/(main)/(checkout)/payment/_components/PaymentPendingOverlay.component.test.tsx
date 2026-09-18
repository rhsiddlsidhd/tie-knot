import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentPendingOverlay } from "./PaymentPendingOverlay";

describe("PaymentPendingOverlay", () => {
  it("visible이 false면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<PaymentPendingOverlay visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("visible이 true면 결제 진행 중 안내를 렌더링한다", () => {
    render(<PaymentPendingOverlay visible={true} />);

    expect(screen.getByText("결제 진행 중...")).toBeInTheDocument();
    expect(screen.getByText("잠시만 기다려주세요.")).toBeInTheDocument();
  });
});
