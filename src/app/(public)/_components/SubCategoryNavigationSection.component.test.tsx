import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavigationSection } from "./SubCategoryNavigationSection";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import {
  PRODUCT_CATEGORIES,
  SUB_CATEGORY_MAP,
} from "@/core/domain/product-category";

const ALL_SUB_CATEGORY_COUNT = PRODUCT_CATEGORIES.reduce(
  (count, category) => count + SUB_CATEGORY_MAP[category].length,
  0,
);

describe("SubCategoryNavigationSection", () => {
  it("공개 상품이 있는 서브카테고리만 링크로 렌더한다", () => {
    const availableSubCategories: AvailableSubCategory[] = [
      { category: "mobile-invitation", subCategory: "wedding" },
      { category: "favor", subCategory: "candle" },
    ];

    render(
      <SubCategoryNavigationSection
        availableSubCategories={availableSubCategories}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "청첩장" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=wedding",
    );
    expect(screen.getByRole("link", { name: "캔들" })).toHaveAttribute(
      "href",
      "/products/favor?subCategory=candle",
    );
    expect(screen.queryByRole("link", { name: "돌잔치" })).toBeNull();
  });

  it("조회 실패(null)면 정적 taxonomy 전체로 폴백한다", () => {
    render(<SubCategoryNavigationSection availableSubCategories={null} />);

    expect(screen.getAllByRole("link")).toHaveLength(ALL_SUB_CATEGORY_COUNT);
    expect(screen.getByRole("link", { name: "돌잔치" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=first-birthday",
    );
  });

  it("공개 상품이 하나도 없으면 섹션 자체를 렌더하지 않는다", () => {
    render(<SubCategoryNavigationSection availableSubCategories={[]} />);

    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByText("카테고리 둘러보기")).toBeNull();
  });

  it("캐러셀 region 랜드마크로 렌더한다", () => {
    render(
      <SubCategoryNavigationSection
        availableSubCategories={[
          { category: "mobile-invitation", subCategory: "wedding" },
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "카테고리 둘러보기" }),
    ).toBeInTheDocument();
  });
});
