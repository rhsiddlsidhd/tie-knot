import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { encodeCursor } from "@/core/utils/cursor";

const validCursor = encodeCursor({
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  id: "68a3f0c1c2d3e4f5a6b7c8d9",
});

const { verifySessionMock, getAdminReviewsPageServiceMock } = vi.hoisted(
  () => ({
    verifySessionMock: vi.fn(),
    getAdminReviewsPageServiceMock: vi.fn(),
  }),
);

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/review", () => ({
  getAdminReviewsPageService: getAdminReviewsPageServiceMock,
}));

vi.mock("@/app/(admin)/admin/reviews/_components/AdminReviewsTemplate", () => ({
  AdminReviewsTemplate: ({
    page,
    q,
    cursor,
  }: {
    page: { items: unknown[]; nextCursor: string | null };
    q?: string;
    cursor?: string;
  }) => (
    <div>
      테이블:items={page.items.length}:q={q ?? "없음"}:cursor={cursor ?? "없음"}
    </div>
  ),
}));

import ReviewsPage from "./page";

const emptyPage: { items: unknown[]; nextCursor: string | null } = {
  items: [],
  nextCursor: null,
};

describe("관리자 리뷰 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAdminReviewsPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({}) });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      ReviewsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();

    expect(getAdminReviewsPageServiceMock).not.toHaveBeenCalled();
  });

  it("cursor가 없으면 첫 페이지로 취급한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({}) });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({});
  });

  it("인증 성공 후 URL의 cursor를 service에 그대로 전달한다", async () => {
    await ReviewsPage({
      searchParams: Promise.resolve({ cursor: validCursor }),
    });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({
      cursor: validCursor,
    });
  });

  it("형식이 깨진 cursor는 제거한다", async () => {
    await ReviewsPage({
      searchParams: Promise.resolve({ cursor: "!!broken!!" }),
    });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({});
  });

  it("service 결과와 현재 cursor를 Table props로 전달한다", async () => {
    getAdminReviewsPageServiceMock.mockResolvedValue({
      items: [{ id: "1" }],
      nextCursor: "next",
    });

    render(
      await ReviewsPage({
        searchParams: Promise.resolve({ cursor: validCursor }),
      }),
    );

    expect(
      screen.getByText(`테이블:items=1:q=없음:cursor=${validCursor}`),
    ).toBeInTheDocument();
  });

  it("검색어를 서비스에 넘기고 Template에 전달한다", async () => {
    render(
      await ReviewsPage({ searchParams: Promise.resolve({ q: "김철수" }) }),
    );

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "김철수" }),
    );
    expect(screen.getByText(/q=김철수/)).toBeInTheDocument();
  });

  it("빈 검색어는 조건 없음으로 정규화한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({ q: "   " }) });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });

  it("검색어와 커서를 함께 넘긴다", async () => {
    await ReviewsPage({
      searchParams: Promise.resolve({ q: "김철수", cursor: validCursor }),
    });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({
      q: "김철수",
      cursor: validCursor,
    });
  });

  // 검색어가 100자를 넘으면 스키마가 통째로 거부한다 — 필터/커서 없음으로 떨어뜨려
  // 페이지가 throw하지 않게 한다.
  it("지나치게 긴 검색어는 조건 없이 조회한다", async () => {
    await ReviewsPage({
      searchParams: Promise.resolve({ q: "가".repeat(101) }),
    });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });
});
