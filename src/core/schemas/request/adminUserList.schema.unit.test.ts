import { describe, it, expect } from "vitest";
import { AdminUserListRequestSchema } from "./adminUserList.schema";

const parse = (input: Record<string, unknown>) =>
  AdminUserListRequestSchema.safeParse(input);

describe("AdminUserListRequestSchema", () => {
  it("목록 기본값을 적용한다", () => {
    expect(parse({}).data).toMatchObject({
      page: 1,
      limit: 10,
      direction: "desc",
    });
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

  it("검색어와 역할 필터를 함께 통과시킨다", () => {
    const result = parse({ q: "김철수", role: "ADMIN" });

    expect(result.success && result.data).toMatchObject({
      q: "김철수",
      role: "ADMIN",
    });
  });

  it("허용되지 않은 역할은 거부한다", () => {
    expect(parse({ role: "SUPERADMIN" }).success).toBe(false);
  });

  it("offset과 정렬 입력을 정규화한다", () => {
    expect(
      parse({ page: "2", limit: "20", sort: "name", direction: "asc" })
        .data,
    ).toMatchObject({ page: 2, limit: 20, sort: "name", direction: "asc" });
  });

  it("허용되지 않은 sort를 거부한다", () => {
    expect(parse({ sort: "email" }).success).toBe(false);
  });
});
