import { describe, it, expect } from "vitest";
import { AdminProductListRequestSchema } from "./adminProductList.schema";

const parse = (input: Record<string, unknown>) =>
  AdminProductListRequestSchema.safeParse(input);

describe("AdminProductListRequestSchema", () => {
  it("아무 조건이 없어도 통과한다", () => {
    expect(parse({}).success).toBe(true);
  });

  it("검색어 앞뒤 공백을 제거한다", () => {
    const result = parse({ q: "  청첩장  " });

    expect(result.success && result.data.q).toBe("청첩장");
  });

  it("빈 검색어는 조건 없음으로 정규화한다", () => {
    expect(parse({ q: "" }).success && parse({ q: "" }).data.q).toBeUndefined();
    expect(
      parse({ q: "   " }).success && parse({ q: "   " }).data.q,
    ).toBeUndefined();
  });

  it("검색어가 100자를 넘으면 거부한다", () => {
    expect(parse({ q: "가".repeat(101) }).success).toBe(false);
  });

  it("검색어와 view 필터를 함께 통과시킨다", () => {
    const result = parse({ q: "청첩장", view: "trash" });

    expect(result.success && result.data).toMatchObject({
      q: "청첩장",
      view: "trash",
    });
  });

  it("허용되지 않은 view는 거부한다", () => {
    expect(parse({ view: "NOT_A_VIEW" }).success).toBe(false);
  });
});
