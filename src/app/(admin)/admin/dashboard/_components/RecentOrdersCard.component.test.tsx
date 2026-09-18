import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardRecentOrder } from "@/core/domain/dashboard";
import { RecentOrdersCard } from "./RecentOrdersCard";

const buildOrder = (
  overrides?: Partial<DashboardRecentOrder>,
): DashboardRecentOrder => ({
  merchantUid: "TK-20260821-0142",
  buyerName: "김민준",
  productTitle: "봄빛 청첩장 세트",
  orderStatus: "CONFIRMED",
  finalPrice: 31000,
  createdAt: new Date("2026-08-19T15:30:00.000Z"),
  ...overrides,
});

describe("RecentOrdersCard", () => {
  it("주문 행을 실제 props 기준으로 렌더링한다", () => {
    render(<RecentOrdersCard orders={[buildOrder()]} />);

    expect(screen.getByText("TK-20260821-0142")).toBeInTheDocument();
    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("봄빛 청첩장 세트")).toBeInTheDocument();
    expect(screen.getByText("31,000원")).toBeInTheDocument();
  });

  it("주문 상태 Badge를 렌더링한다", () => {
    render(<RecentOrdersCard orders={[buildOrder()]} />);

    expect(screen.getByText("결제완료")).toBeInTheDocument();
  });

  it("테이블 헤더를 렌더링한다", () => {
    render(<RecentOrdersCard orders={[buildOrder()]} />);

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "주문번호",
      "고객명",
      "상품",
      "상태",
      "금액",
      "시간",
    ]);
  });

  it("주문이 없으면 빈 상태 UI를 보여준다", () => {
    render(<RecentOrdersCard orders={[]} />);

    expect(screen.getByText("아직 주문이 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText("첫 주문이 들어오면 여기에 표시됩니다."),
    ).toBeInTheDocument();
  });

  it("전체 보기 링크가 주문 관리 페이지를 가리킨다", () => {
    render(<RecentOrdersCard orders={[buildOrder()]} />);

    expect(screen.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
  });
});
