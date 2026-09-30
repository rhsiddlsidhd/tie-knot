import { describe, it, expect } from "vitest";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import {
  buildCategoryNavigationItems,
  resolveActiveNavigationHref,
} from "@/core/utils/navigation";

describe("buildCategoryNavigationItems", () => {
  it("전달된 서브카테고리만 하위 링크로 만든다", () => {
    const available: AvailableSubCategory[] = [
      { category: "guestbook", subCategory: "book" },
    ];

    const [group] = buildCategoryNavigationItems(available);

    expect(group!.submenu.map(({ label }) => label)).toEqual([
      "전체보기",
      "방명록",
    ]);
  });

  it("각 그룹 맨 앞에 카테고리 전체보기 링크를 둔다", () => {
    const available: AvailableSubCategory[] = [
      { category: "guestbook", subCategory: "stamp" },
    ];

    const [group] = buildCategoryNavigationItems(available);

    expect(group!.submenu[0]).toMatchObject({
      label: "전체보기",
      href: "/products/guestbook",
    });
    expect(group!.submenu[1]!.href).toBe(
      "/products/guestbook?subCategory=stamp",
    );
  });

  it("사용 가능한 서브카테고리가 없는 카테고리는 그룹째 제외한다", () => {
    const available: AvailableSubCategory[] = [
      { category: "guestbook", subCategory: "book" },
    ];

    const labels = buildCategoryNavigationItems(available).map(
      ({ label }) => label,
    );

    expect(labels).toEqual(["방명록 굿즈"]);
  });

  it("빈 목록이면 그룹을 만들지 않는다", () => {
    expect(buildCategoryNavigationItems([])).toEqual([]);
  });

  it("카테고리 순서는 PRODUCT_CATEGORIES 순서를 따른다", () => {
    const available: AvailableSubCategory[] = [
      { category: "guestbook", subCategory: "book" },
      { category: "favor", subCategory: "candle" },
    ];

    const labels = buildCategoryNavigationItems(available).map(
      ({ label }) => label,
    );

    expect(labels).toEqual(["답례품", "방명록 굿즈"]);
  });
});

describe("resolveActiveNavigationHref", () => {
  it("subCategory가 없으면 pathname을 그대로 쓴다", () => {
    expect(resolveActiveNavigationHref("/products/guestbook", null)).toBe(
      "/products/guestbook",
    );
  });

  it("subCategory가 있으면 쿼리를 붙인 href로 만든다", () => {
    expect(resolveActiveNavigationHref("/products/guestbook", "stamp")).toBe(
      "/products/guestbook?subCategory=stamp",
    );
  });
});
