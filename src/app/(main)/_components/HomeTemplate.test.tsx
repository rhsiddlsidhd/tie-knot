import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain";

vi.mock("./EcommerceHero", () => ({
  EcommerceHero: () => <div>hero</div>,
}));
vi.mock("./LiveDemoSection", () => ({
  LiveDemoSection: () => <div>live-demo</div>,
}));
vi.mock("@/ui/components/molecules", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div>card-{product._id}</div>
  ),
}));

import { HomeTemplate } from "./HomeTemplate";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";

const AVAILABLE_SUB_CATEGORIES = [
  { category: MOBILE_INVITATION_CATEGORY, subCategory: "wedding" },
] as const;

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({ _id: "product-1", title: "봄맞이 청첩장", ...overrides }) as Product;

const buildProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, i) =>
    buildProduct({ _id: `product-${i + 1}` }),
  );

describe("HomeTemplate", () => {
  it("hero와 라이브 데모 섹션은 항상 렌더링한다", () => {
    render(
      <HomeTemplate
        popularProducts={[]}
        availableSubCategories={AVAILABLE_SUB_CATEGORIES}
      />,
    );

    expect(screen.getByText("hero")).toBeInTheDocument();
    expect(screen.getByText("live-demo")).toBeInTheDocument();
  });

  it("SubCategoryNavSection → 인기 상품 순서로 배치된다", () => {
    render(
      <HomeTemplate
        popularProducts={buildProducts(3)}
        availableSubCategories={AVAILABLE_SUB_CATEGORIES}
      />,
    );

    const html = document.body.innerHTML;
    const subCategoryNavIndex = html.indexOf("카테고리 둘러보기");
    const popularSectionIndex = html.indexOf("인기 상품");

    expect(subCategoryNavIndex).toBeGreaterThan(-1);
    expect(popularSectionIndex).toBeGreaterThan(subCategoryNavIndex);
  });
});
