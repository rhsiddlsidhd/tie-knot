import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavigationSection } from "./SubCategoryNavigationSection";
import {
  PRODUCT_CATEGORIES,
  SUB_CATEGORY_MAP,
} from "@/core/domain/product-category";

describe("SubCategoryNavigationSection", () => {
  it("로컬 taxonomy의 모든 서브카테고리를 링크로 렌더한다", () => {
    render(<SubCategoryNavigationSection />);

    const expectedCount = PRODUCT_CATEGORIES.reduce(
      (count, category) => count + SUB_CATEGORY_MAP[category].length,
      0,
    );

    expect(screen.getAllByRole("link")).toHaveLength(expectedCount);
    expect(screen.getByRole("link", { name: "청첩장" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=wedding",
    );
    expect(screen.getByRole("link", { name: "돌잔치" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=first-birthday",
    );
    expect(screen.getByRole("link", { name: "캔들" })).toHaveAttribute(
      "href",
      "/products/favor?subCategory=candle",
    );
  });

  it("캐러셀 region 랜드마크로 렌더한다", () => {
    render(<SubCategoryNavigationSection />);

    expect(
      screen.getByRole("region", { name: "카테고리 둘러보기" }),
    ).toBeInTheDocument();
  });
});
