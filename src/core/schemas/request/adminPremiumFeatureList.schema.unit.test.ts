import { describe, expect, it } from "vitest";
import { AdminPremiumFeatureListRequestSchema } from "./adminPremiumFeatureList.schema";

describe("AdminPremiumFeatureListRequestSchema", () => {
  it("목록 기본값을 적용한다", () => {
    expect(AdminPremiumFeatureListRequestSchema.parse({})).toMatchObject({
      page: 1,
      limit: 10,
      direction: "desc",
    });
  });
  it("검색어와 offset·정렬 입력을 정규화한다", () => {
    expect(
      AdminPremiumFeatureListRequestSchema.parse({
        page: "2",
        limit: "20",
        q: "  갤러리  ",
        sort: "additionalPrice",
        direction: "asc",
      }),
    ).toMatchObject({
      page: 2,
      limit: 20,
      q: "갤러리",
      sort: "additionalPrice",
      direction: "asc",
    });
  });
  it("허용되지 않은 sort를 거부한다", () => {
    expect(
      AdminPremiumFeatureListRequestSchema.safeParse({ sort: "code" }).success,
    ).toBe(false);
  });
});
