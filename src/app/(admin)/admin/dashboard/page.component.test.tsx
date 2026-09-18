import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardStats } from "@/core/domain/dashboard";

const { verifySessionMock, getDashboardStatsServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getDashboardStatsServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/dashboard", () => ({
  getDashboardStatsService: getDashboardStatsServiceMock,
}));

vi.mock(
  "@/app/(admin)/admin/dashboard/_components/AdminDashboardTemplate",
  () => ({
    AdminDashboardTemplate: ({ stats }: { stats: DashboardStats }) => (
      <div>템플릿:totalProducts={stats.totalProducts}</div>
    ),
  }),
);

import AdminDashboard from "./page";

const stats: DashboardStats = {
  totalProducts: 24,
  productsCreatedThisMonth: 2,
  totalUsers: 342,
  usersCreatedThisMonth: 23,
  revenueThisMonth: 1234000,
  revenuePreviousMonth: 1000000,
  paidOrderCountThisMonth: 89,
  paidOrderCountPreviousMonth: 80,
  recentOrders: [],
};

describe("관리자 대시보드 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getDashboardStatsServiceMock.mockResolvedValue(stats);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await AdminDashboard();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 통계 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(AdminDashboard()).rejects.toThrow();

    expect(getDashboardStatsServiceMock).not.toHaveBeenCalled();
  });

  it("service가 반환한 통계를 Template props로 전달한다", async () => {
    render(await AdminDashboard());

    expect(screen.getByText("템플릿:totalProducts=24")).toBeInTheDocument();
  });
});
