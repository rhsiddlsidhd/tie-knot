import { describe, it, expect } from "vitest";
import { AdminPremiumFeatureListRequestSchema } from "./adminPremiumFeatureList.schema";

describe("AdminPremiumFeatureListRequestSchema", () => {
  it("cursor 문자열을 그대로 통과시킨다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      cursor: "encoded-cursor",
    });

    expect(result.success).toBe(true);
    expect(result.data?.cursor).toBe("encoded-cursor");
  });

  it("빈 문자열 cursor는 undefined로 정규화한다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      cursor: "",
    });

    expect(result.success).toBe(true);
    expect(result.data?.cursor).toBeUndefined();
  });

  it("null cursor는 undefined로 정규화한다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      cursor: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.cursor).toBeUndefined();
  });

  it("cursor가 문자열이 아니면 실패한다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      cursor: 123,
    });

    expect(result.success).toBe(false);
  });

  it("검색어 앞뒤 공백을 제거한다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      q: "  갤러리  ",
    });

    expect(result.success && result.data.q).toBe("갤러리");
  });

  it("빈 검색어는 조건 없음으로 정규화한다", () => {
    expect(
      AdminPremiumFeatureListRequestSchema.safeParse({ q: "" }).data?.q,
    ).toBeUndefined();
    expect(
      AdminPremiumFeatureListRequestSchema.safeParse({ q: "   " }).data?.q,
    ).toBeUndefined();
  });

  it("null 검색어는 조건 없음으로 정규화한다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      q: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.q).toBeUndefined();
  });

  it("검색어가 100자를 넘으면 거부한다", () => {
    expect(
      AdminPremiumFeatureListRequestSchema.safeParse({ q: "가".repeat(101) })
        .success,
    ).toBe(false);
  });

  it("검색어와 커서를 함께 통과시킨다", () => {
    const result = AdminPremiumFeatureListRequestSchema.safeParse({
      q: "갤러리",
      cursor: "encoded-cursor",
    });

    expect(result.success && result.data).toMatchObject({
      q: "갤러리",
      cursor: "encoded-cursor",
    });
  });
});
