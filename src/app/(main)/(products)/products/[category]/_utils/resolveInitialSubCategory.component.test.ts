import { describe, expect, it } from "vitest";
import { resolveInitialSubCategory } from "./resolveInitialSubCategory";

describe("resolveInitialSubCategory", () => {
  const AVAILABLE_SUB_CATEGORIES = ["candle", "soap"] as const;

  it("현재 공개 상품이 있는 서브카테고리를 초기값으로 반환한다", () => {
    expect(resolveInitialSubCategory("soap", AVAILABLE_SUB_CATEGORIES)).toBe(
      "soap",
    );
  });

  it.each([
    { query: undefined, description: "누락" },
    { query: "", description: "빈 문자열" },
    { query: "diffuser", description: "상품이 없는 유효 값" },
    { query: "wedding", description: "다른 카테고리 값" },
    { query: "legacy", description: "알 수 없는 값" },
    { query: ["candle", "soap"], description: "반복 query" },
  ])("$description이면 all로 폴백한다", ({ query }) => {
    expect(resolveInitialSubCategory(query, AVAILABLE_SUB_CATEGORIES)).toBe(
      "all",
    );
  });
});
