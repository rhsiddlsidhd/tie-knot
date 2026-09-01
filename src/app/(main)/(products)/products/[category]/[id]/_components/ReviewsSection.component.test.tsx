import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReviewListPage } from "@/core/domain";
import { ReviewsSection } from "./ReviewsSection";

const buildReviews = (overrides?: Partial<ReviewListPage>): ReviewListPage => ({
  items: [
    {
      _id: "review-1",
      productId: "product-1",
      authorName: "김*준",
      rating: 5,
      content: "아주 만족스러운 상품이었어요.",
      images: [],
      isOwner: false,
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
    },
  ],
  nextCursor: null,
  ...overrides,
});

describe("ReviewsSection", () => {
  it("리뷰가 없으면 안내 문구를 보여준다", () => {
    render(<ReviewsSection reviews={{ items: [], nextCursor: null }} sort="LATEST" />);

    expect(screen.getByText("아직 작성된 리뷰가 없습니다.")).toBeInTheDocument();
  });

  it("리뷰 목록과 작성자/내용/평점을 렌더링한다", () => {
    render(<ReviewsSection reviews={buildReviews()} sort="LATEST" />);

    expect(screen.getByText("김*준")).toBeInTheDocument();
    expect(
      screen.getByText("아주 만족스러운 상품이었어요."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("평점 5점")).toBeInTheDocument();
  });

  it("현재 정렬이 아닌 탭은 그 정렬로 이동하는 링크를 만든다", () => {
    render(<ReviewsSection reviews={buildReviews()} sort="LATEST" />);

    expect(screen.getByRole("link", { name: "평점 높은순" })).toHaveAttribute(
      "href",
      "?sort=RATING_HIGH",
    );
    expect(screen.getByRole("link", { name: "최신순" })).toHaveAttribute(
      "href",
      "?",
    );
  });

  it("nextCursor가 있으면 현재 정렬을 유지한 더보기 링크를 보여준다", () => {
    render(
      <ReviewsSection
        reviews={buildReviews({ nextCursor: "cursor-abc" })}
        sort="RATING_HIGH"
      />,
    );

    expect(screen.getByRole("link", { name: "더보기" })).toHaveAttribute(
      "href",
      "?sort=RATING_HIGH&reviewCursor=cursor-abc",
    );
  });

  it("nextCursor가 없으면 더보기 링크를 보여주지 않는다", () => {
    render(<ReviewsSection reviews={buildReviews()} sort="LATEST" />);

    expect(screen.queryByRole("link", { name: "더보기" })).toBeNull();
  });
});
