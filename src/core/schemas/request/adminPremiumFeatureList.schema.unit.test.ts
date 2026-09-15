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
});
