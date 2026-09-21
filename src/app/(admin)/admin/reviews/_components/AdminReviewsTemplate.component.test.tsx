import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AdminReviewListPage } from "@/core/domain/review";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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

  it("nextCursor가 없으면 다음 페이지 버튼이 비활성화된다", () => {
    render(<AdminReviewsTemplate page={buildPage({ nextCursor: null })} />);

    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });
  it("검색 입력은 현재 검색어를 기본값으로 갖는다", () => {
    render(<AdminReviewsTemplate page={buildPage()} q="봄빛" />);

    expect(screen.getByRole("searchbox", { name: /리뷰 검색/ })).toHaveValue(
      "봄빛",
    );
  });

  it("검색 결과가 없으면 검색어를 지우라는 안내를 보여준다", () => {
    render(
      <AdminReviewsTemplate page={buildPage({ items: [] })} q="없는사람" />,
    );

    expect(screen.getByText(/검색어를 지우면/)).toBeInTheDocument();
  });
});
