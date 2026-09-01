import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product, PremiumFeature, ReviewListPage } from "@/core/domain";

vi.mock("./ProductViewTracker", () => ({
  ProductViewTracker: (): null => null,
}));

vi.mock("../_containers/ProductSummary", () => ({
  ProductSummary: ({ product }: { product: { title: string } }) => (
    <div>{product.title}</div>
  ),
}));

vi.mock("./ReviewsSection", () => ({
  ReviewsSection: ({ reviews }: { reviews: ReviewListPage }) => (
    <div>리뷰 {reviews.items.length}개</div>
  ),
}));

vi.mock("./ProductFeatures", () => ({
  ProductFeatures: ({ options }: { options: { label: string }[] }) => (
    <div>{options.map((o) => o.label).join(",")}</div>
  ),
}));

import { ProductDetailTemplate } from "./ProductDetailTemplate";

const buildProduct = (): Product => ({ title: "봄맞이 청첩장" }) as Product;
const buildOptions = (): PremiumFeature[] =>
  [{ label: "고급 테마" }] as PremiumFeature[];
const buildReviews = (): ReviewListPage => ({ items: [], nextCursor: null });

describe("ProductDetailTemplate", () => {
  it("상품 요약과 상세 옵션, 리뷰 섹션을 함께 렌더링한다", () => {
    render(
      <ProductDetailTemplate
        product={buildProduct()}
        options={buildOptions()}
        reviews={buildReviews()}
        sort="LATEST"
      />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("고급 테마")).toBeInTheDocument();
    expect(screen.getByText("리뷰 0개")).toBeInTheDocument();
  });
});
