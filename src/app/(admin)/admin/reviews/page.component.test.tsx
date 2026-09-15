import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { encodeCursor } from "@/core/utils/cursor";

const validCursor = encodeCursor({
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  id: "68a3f0c1c2d3e4f5a6b7c8d9",
});

const { verifySessionMock, getAdminReviewsPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminReviewsPageServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/review", () => ({
  getAdminReviewsPageService: getAdminReviewsPageServiceMock,
}));

vi.mock("@/app/(admin)/admin/reviews/_components/AdminReviewsTemplate", () => ({
  AdminReviewsTemplate: ({
    page,
    cursor,
  }: {
    page: { items: unknown[]; nextCursor: string | null };
    cursor?: string;
  }) => (
    <div>
      테이블:items={page.items.length}:cursor={cursor ?? "없음"}
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
    verifySessionMock.mockResolvedValue({ role: "ADMIN", email: "a@x.com", userId: "1" });
    getAdminReviewsPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({}) });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(ReviewsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();

    expect(getAdminReviewsPageServiceMock).not.toHaveBeenCalled();
  });

  it("cursor가 없으면 첫 페이지로 취급한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({}) });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({});
  });

  it("인증 성공 후 URL의 cursor를 service에 그대로 전달한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({ cursor: validCursor }) });

    expect(getAdminReviewsPageServiceMock).toHaveBeenCalledWith({ cursor: validCursor });
  });

  it("형식이 깨진 cursor는 제거한다", async () => {
    await ReviewsPage({ searchParams: Promise.resolve({ cursor: "!!broken!!" }) });

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
      screen.getByText(`테이블:items=1:cursor=${validCursor}`),
    ).toBeInTheDocument();
  });
});
