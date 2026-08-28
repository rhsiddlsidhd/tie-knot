import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavSection } from "./SubCategoryNavSection";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";

describe("SubCategoryNavSection", () => {
  it("전달된 서브카테고리만 링크로 렌더한다", () => {
    render(
      <SubCategoryNavSection
        availableSubCategories={[
          { category: MOBILE_INVITATION_CATEGORY, subCategory: "first-birthday" },
          { category: "favor", subCategory: "candle" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "돌잔치" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=first-birthday",
    );
    expect(screen.getByRole("link", { name: "캔들" })).toHaveAttribute(
      "href",
      "/products/favor?subCategory=candle",
    );
    expect(
      screen.queryByRole("link", { name: "청첩장" }),
    ).not.toBeInTheDocument();
  });

  it("캐러셀 region 랜드마크로 렌더한다", () => {
    render(
      <SubCategoryNavSection
        availableSubCategories={[
          { category: MOBILE_INVITATION_CATEGORY, subCategory: "wedding" },
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "서브카테고리 바로가기" }),
    ).toBeInTheDocument();
  });

  it("사용 가능한 서브카테고리가 없으면 섹션 전체를 렌더링하지 않는다", () => {
    render(<SubCategoryNavSection availableSubCategories={[]} />);

    expect(screen.queryByText("카테고리 둘러보기")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "서브카테고리 바로가기" }),
    ).not.toBeInTheDocument();
  });
});
