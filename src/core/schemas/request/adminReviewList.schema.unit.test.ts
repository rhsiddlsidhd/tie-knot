import { describe, it, expect } from "vitest";
import { AdminReviewListRequestSchema } from "./adminReviewList.schema";

const parse = (input: Record<string, unknown>) =>
  AdminReviewListRequestSchema.safeParse(input);

describe("AdminReviewListRequestSchema", () => {
  it("아무 조건이 없어도 통과한다", () => {
    expect(parse({}).success).toBe(true);
  });

  it("검색어 앞뒤 공백을 제거한다", () => {
    const result = parse({ q: "  김철수  " });

    expect(result.success && result.data.q).toBe("김철수");
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

  it("빈 cursor는 조건 없음으로 정규화한다", () => {
    const result = parse({ cursor: "" });

    expect(result.success && result.data.cursor).toBeUndefined();
  });
});
