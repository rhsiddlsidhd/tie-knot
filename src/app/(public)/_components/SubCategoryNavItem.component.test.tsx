import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubCategoryNavItem } from "./SubCategoryNavItem";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

describe("SubCategoryNavItem", () => {
  it("청첩장(wedding) 링크를 올바른 href로 렌더한다", () => {
    render(<SubCategoryNavItem category={MOBILE_INVITATION_CATEGORY} subCategory="wedding" />);

    const link = screen.getByRole("link", { name: "청첩장" });
    expect(link).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=wedding",
    );
  });

  it("돌잔치(first-birthday) 링크를 올바른 href로 렌더한다 — 하이픈 유지", () => {
    render(
      <SubCategoryNavItem category={MOBILE_INVITATION_CATEGORY} subCategory="first-birthday" />,
    );

    const link = screen.getByRole("link", { name: "돌잔치" });
    expect(link).toHaveAttribute(
      "href",
      "/products/mobile-invitation?subCategory=first-birthday",
    );
  });

  it("아이콘 없이 라벨만 렌더한다", () => {
    const { container } = render(
      <SubCategoryNavItem category="favor" subCategory="candle" />,
    );

    expect(screen.getByRole("link", { name: "캔들" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });
});
