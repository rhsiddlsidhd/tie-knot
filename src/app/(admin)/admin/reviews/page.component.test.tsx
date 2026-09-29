import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, getAdminReviewsPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminReviewsPageServiceMock: vi.fn(),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/review", () => ({
  getAdminReviewsPageService: getAdminReviewsPageServiceMock,
}));
vi.mock("@/app/(admin)/admin/reviews/_components/AdminReviewsTemplate", () => ({
  AdminReviewsTemplate: ({ page, q }: { page: { items: unknown[] }; q?: string }) => (
    <div>테이블:items={page.items.length}:q={q ?? "없음"}</div>
  ),
}));

import ReviewsPage from "./page";
const emptyPage = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };

describe("관리자 리뷰 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN", email: "a@x.com", userId: "1" });
    getAdminReviewsPageServiceMock.mockResolvedValue(emptyPage);
  });
  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({}) });
    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });
  it("offset·정렬·검색을 서비스에 전달한다", async () => {
    await ReviewsPage({
      searchParams: Promise.resolve({
        page: "2",
        limit: "20",
        q: "상품",
        sort: "rating",
        direction: "asc",
      }),
    });
    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({
      page: 2, limit: 20, q: "상품", sort: "rating", direction: "asc",
    });
  });
  it("잘못된 입력은 기본 목록 요청으로 정규화한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({ page: "0" }) });
    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({
      page: 1, limit: 10, q: undefined, sort: undefined, direction: "desc",
    });
  });
  it("서비스 결과와 검색어를 템플릿에 전달한다", async () => {
    getAdminReviewsPageServiceMock.mockResolvedValue({
      ...emptyPage,
      items: [{ id: "1" }],
      total: 1,
      totalPages: 1,
    });
    render(await ReviewsPage({ searchParams: Promise.resolve({ q: "상품" }) }));
    expect(screen.getByText("테이블:items=1:q=상품")).toBeInTheDocument();
  });
});
