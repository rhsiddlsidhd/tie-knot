import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminReviewListPage } from "@/core/domain";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
  usePathname: () => "/admin/reviews",
}));

const deleteReviewByAdmin = vi.fn();
vi.mock("@/actions/deleteReviewByAdmin", () => ({
  deleteReviewByAdmin: (...args: unknown[]) => deleteReviewByAdmin(...args),
}));

import { AdminReviewsTemplate } from "./AdminReviewsTemplate";

const buildPage = (
  overrides?: Partial<AdminReviewListPage>,
): AdminReviewListPage => ({
  items: [
    {
      id: "review-1",
      productTitle: "봄빛 청첩장 세트",
      authorName: "김민준",
      rating: 5,
      content: "아주 만족스러운 상품이었어요.",
      createdAt: new Date("2026-08-19T15:30:00.000Z"), // KST 2026-08-20
    },
  ],
  nextCursor: null,
  ...overrides,
});

describe("AdminReviewsTemplate", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    deleteReviewByAdmin.mockClear();
  });

  it("리뷰 행을 실제 props 기준으로 렌더링하고 작성일을 KST로 표시한다", () => {
    render(<AdminReviewsTemplate page={buildPage()} />);

    expect(screen.getByText("봄빛 청첩장 세트")).toBeInTheDocument();
    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(
      screen.getByText("아주 만족스러운 상품이었어요."),
    ).toBeInTheDocument();
    expect(screen.getByText("2026.8.20")).toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 UI를 보여준다", () => {
    render(<AdminReviewsTemplate page={buildPage({ items: [] })} />);

    expect(screen.getByText("등록된 리뷰가 없습니다")).toBeInTheDocument();
  });

  it("삭제 확인 후 deleteReviewByAdmin을 호출하고 성공하면 새로고침한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteReviewByAdmin.mockResolvedValue({
      success: true,
      data: { message: "리뷰가 삭제되었습니다." },
    });
    const user = userEvent.setup();
    render(<AdminReviewsTemplate page={buildPage()} />);

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(deleteReviewByAdmin).toHaveBeenCalledWith("review-1");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("삭제를 취소하면 deleteReviewByAdmin을 호출하지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<AdminReviewsTemplate page={buildPage()} />);

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(deleteReviewByAdmin).not.toHaveBeenCalled();
  });

  it("nextCursor가 없으면 다음 페이지 버튼이 비활성화된다", () => {
    render(<AdminReviewsTemplate page={buildPage({ nextCursor: null })} />);

    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });
});
