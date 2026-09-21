import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingCoupleInfoBanner } from "./PendingCoupleInfoBanner";

describe("PendingCoupleInfoBanner", () => {
  it("정보 입력을 안내하는 문구를 표시한다", () => {
    render(<PendingCoupleInfoBanner orderId="order-1" />);

    expect(
      screen.getByText(/청첩장 정보가 아직 입력되지 않았어요/),
    ).toBeInTheDocument();
  });

  it("daysLeft가 남아 있으면 D-day와 자동취소 안내를 표시한다", () => {
    render(<PendingCoupleInfoBanner orderId="order-1" daysLeft={3} />);

    expect(screen.getByText("D-3, 이후 자동취소·환불")).toBeInTheDocument();
  });

  it("daysLeft가 음수면 기한이 지났다고 표시한다", () => {
    render(<PendingCoupleInfoBanner orderId="order-1" daysLeft={-1} />);

    expect(
      screen.getByText("입력 기한이 지나 자동취소·환불 대상입니다"),
    ).toBeInTheDocument();
  });

  it("daysLeft를 주지 않으면 기한 문구를 렌더링하지 않는다", () => {
    render(<PendingCoupleInfoBanner orderId="order-1" />);

    expect(screen.queryByText(/자동취소/)).not.toBeInTheDocument();
  });

  it("정보 입력하기 링크가 해당 주문의 청첩장 편집 화면을 가리킨다", () => {
    render(<PendingCoupleInfoBanner orderId="order-1" />);

    expect(screen.getByRole("link", { name: /정보 입력하기/ })).toHaveAttribute(
      "href",
      "/my-orders/order-1/mobile-invitation",
    );
  });
});
