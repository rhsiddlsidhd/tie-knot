import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { DashboardRecentOrder, DashboardStats } from "@/core/domain";
import { AdminDashboardTemplate } from "./AdminDashboardTemplate";

const buildRecentOrder = (
  overrides?: Partial<DashboardRecentOrder>,
): DashboardRecentOrder => ({
  merchantUid: "TK-20260821-0142",
  buyerName: "김민준",
  productTitle: "봄빛 청첩장 세트",
  finalPrice: 31000,
  orderStatus: "CONFIRMED",
  createdAt: new Date("2026-08-27T10:00:00.000Z"),
  ...overrides,
});

const buildStats = (overrides?: Partial<DashboardStats>): DashboardStats => ({
  totalProducts: 24,
  productsCreatedThisMonth: 2,
  totalUsers: 342,
  usersCreatedThisMonth: 23,
  revenueThisMonth: 1234000,
  revenuePreviousMonth: 1000000,
  paidOrderCountThisMonth: 89,
  paidOrderCountPreviousMonth: 80,
  recentOrders: [buildRecentOrder()],
  ...overrides,
});

const getCard = (titleText: string) => {
  const title = screen.getByText(titleText);
  const card = title.closest('[data-slot="card"]');
  if (!card) throw new Error(`카드(${titleText})를 찾지 못했습니다`);
  return within(card as HTMLElement);
};

describe("AdminDashboardTemplate", () => {
  it("① 정상 상태: 카드 4개 값/trend와 최근 주문 테이블을 렌더링한다", () => {
    render(<AdminDashboardTemplate stats={buildStats()} />);

    expect(getCard("등록 상품").getByText("24")).toBeInTheDocument();
    expect(getCard("등록 상품").getByText("+2개 이번 달")).toBeInTheDocument();

    expect(getCard("총 매출").getByText("₩1,234,000")).toBeInTheDocument();
    expect(getCard("총 매출").getByText("+23.4% 지난 달 대비")).toBeInTheDocument();

    expect(getCard("결제 주문").getByText("89")).toBeInTheDocument();
    expect(getCard("결제 주문").getByText("+11.3% 지난 달 대비")).toBeInTheDocument();

    expect(getCard("활동 회원").getByText("342")).toBeInTheDocument();
    expect(getCard("활동 회원").getByText("+23명 이번 달")).toBeInTheDocument();

    expect(screen.getByText("TK-20260821-0142")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/admin/orders",
    );
  });

  it("② 전월 실적이 0이면 매출/결제주문 trend 줄이 렌더되지 않는다 (상태 C)", () => {
    render(
      <AdminDashboardTemplate
        stats={buildStats({
          revenuePreviousMonth: 0,
          paidOrderCountPreviousMonth: 0,
        })}
      />,
    );

    expect(screen.queryByText(/지난 달 대비/)).not.toBeInTheDocument();
    // 저량 지표(상품/회원) trend는 이번 달 증가분 기준이라 영향받지 않는다.
    expect(getCard("등록 상품").getByText("+2개 이번 달")).toBeInTheDocument();
  });

  it("③ recentOrders가 빈 배열이면 빈 상태 문구를 렌더링하고 카드 4개는 정상 렌더된다 (상태 D)", () => {
    render(<AdminDashboardTemplate stats={buildStats({ recentOrders: [] })} />);

    expect(screen.getByText("아직 주문이 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText("첫 주문이 들어오면 여기에 표시됩니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    expect(getCard("등록 상품").getByText("24")).toBeInTheDocument();
    expect(getCard("총 매출").getByText("₩1,234,000")).toBeInTheDocument();
  });

  it("④ 오픈 첫 달 통합(전 지표 0 + 주문 0건): 값 0은 그대로 렌더되고 trend 줄은 전부 생략된다 (상태 C+D)", () => {
    render(
      <AdminDashboardTemplate
        stats={{
          totalProducts: 0,
          productsCreatedThisMonth: 0,
          totalUsers: 0,
          usersCreatedThisMonth: 0,
          revenueThisMonth: 0,
          revenuePreviousMonth: 0,
          paidOrderCountThisMonth: 0,
          paidOrderCountPreviousMonth: 0,
          recentOrders: [],
        }}
      />,
    );

    expect(getCard("등록 상품").getByText("0")).toBeInTheDocument();
    expect(getCard("총 매출").getByText("₩0")).toBeInTheDocument();
    expect(getCard("결제 주문").getByText("0")).toBeInTheDocument();
    expect(getCard("활동 회원").getByText("0")).toBeInTheDocument();

    expect(screen.queryByText(/이번 달$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/지난 달 대비/)).not.toBeInTheDocument();

    expect(screen.getByText("아직 주문이 없습니다")).toBeInTheDocument();
  });
});
