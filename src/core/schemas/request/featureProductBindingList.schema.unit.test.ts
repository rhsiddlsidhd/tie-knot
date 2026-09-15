import { describe, it, expect } from "vitest";
import { FeatureProductBindingListRequestSchema } from "./featureProductBindingList.schema";

const parse = (input: Record<string, unknown>) =>
  FeatureProductBindingListRequestSchema.safeParse(input);

describe("FeatureProductBindingListRequestSchema", () => {
  it("q와 cursor가 없어도 통과한다", () => {
    const result = parse({});

    expect(result.success).toBe(true);
  });

  it("검색어 앞뒤 공백을 제거한다", () => {
    const result = parse({ q: "  봄맞이  " });

    expect(result.success && result.data.q).toBe("봄맞이");
  });

  // URL은 "값 없음"을 빈 문자열로도 표현한다(`?q=`) — 검색 해제와 같은 의미다.
  it("빈 검색어는 조건 없음으로 정규화한다", () => {
    expect(parse({ q: "" }).success && parse({ q: "" }).data.q).toBeUndefined();
    expect(
      parse({ q: "   " }).success && parse({ q: "   " }).data.q,
    ).toBeUndefined();
  });

  it("검색어가 100자를 넘으면 거부한다", () => {
    const result = parse({ q: "가".repeat(101) });

    expect(result.success).toBe(false);
  });

  it("빈 cursor는 조건 없음으로 정규화한다", () => {
    const result = parse({ cursor: "" });

    expect(result.success && result.data.cursor).toBeUndefined();
  });

  it("cursor 문자열을 그대로 통과시킨다", () => {
    const result = parse({ cursor: "abc123" });

    expect(result.success && result.data.cursor).toBe("abc123");
  });
});
