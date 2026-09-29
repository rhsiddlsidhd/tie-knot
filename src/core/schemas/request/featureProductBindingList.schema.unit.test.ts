import { describe, it, expect } from "vitest";
import { FeatureProductBindingListRequestSchema } from "./featureProductBindingList.schema";

const parse = (input: Record<string, unknown>) =>
  FeatureProductBindingListRequestSchema.safeParse(input);

describe("FeatureProductBindingListRequestSchema", () => {
  it("목록 기본값을 적용한다", () => {
    const result = parse({});

    expect(result.data).toMatchObject({
      page: 1,
      limit: 10,
      direction: "desc",
    });
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

  it("offset과 정렬 입력을 정규화한다", () => {
    expect(
      parse({ page: "2", limit: "20", sort: "price", direction: "asc" }).data,
    ).toMatchObject({ page: 2, limit: 20, sort: "price", direction: "asc" });
  });

  it("허용되지 않은 sort를 거부한다", () => {
    expect(parse({ sort: "status" }).success).toBe(false);
  });

  it("연결 여부 필터를 통과시킨다", () => {
    const result = parse({ attached: "unattached" });

    expect(result.success && result.data.attached).toBe("unattached");
  });

  it("허용되지 않은 attached를 거부한다", () => {
    expect(parse({ attached: "yes" }).success).toBe(false);
  });
});
