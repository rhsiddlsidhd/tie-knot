import { describe, expect, it } from "vitest";
import { OffsetListRequestSchema } from "./offsetList.schema";

describe("OffsetListRequestSchema", () => {
  it("목록 기본값을 적용한다", () => {
    expect(OffsetListRequestSchema.parse({})).toEqual({
      page: 1,
      limit: 10,
      q: undefined,
      direction: "desc",
    });
  });

  it("문자열 page와 limit을 정수로 변환한다", () => {
    expect(
      OffsetListRequestSchema.parse({ page: "2", limit: "50" }),
    ).toMatchObject({ page: 2, limit: 50 });
  });

  it.each([
    { page: "0" },
    { page: "1.5" },
    { limit: "0" },
    { limit: "51" },
    { limit: "1.5" },
  ])("페이지 범위를 벗어난 입력을 거부한다: %o", (input) => {
    expect(OffsetListRequestSchema.safeParse(input).success).toBe(false);
  });

  it("검색어를 정규화하고 정렬 방향을 통과시킨다", () => {
    expect(
      OffsetListRequestSchema.parse({ q: "  상품  ", direction: "asc" }),
    ).toMatchObject({ q: "상품", direction: "asc" });
  });

  it("빈 문자열을 기본값 또는 조건 없음으로 정규화한다", () => {
    expect(
      OffsetListRequestSchema.parse({
        page: "",
        limit: "",
        q: "",
        direction: "",
      }),
    ).toEqual({ page: 1, limit: 10, q: undefined, direction: "desc" });
  });

  it("허용되지 않은 정렬 방향을 거부한다", () => {
    expect(
      OffsetListRequestSchema.safeParse({ direction: "sideways" }).success,
    ).toBe(false);
  });
});
