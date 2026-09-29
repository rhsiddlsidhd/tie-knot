import { describe, expect, it } from "vitest";

import { getNextSortState } from "./sort-cycle";

describe("getNextSortState", () => {
  it("다른 열을 선택하면 내림차순으로 시작한다", () => {
    expect(getNextSortState("createdAt", "asc", "price")).toEqual({
      sort: "price",
      direction: "desc",
    });
  });

  it("정렬되지 않은 열을 선택하면 내림차순으로 시작한다", () => {
    expect(getNextSortState(undefined, undefined, "createdAt")).toEqual({
      sort: "createdAt",
      direction: "desc",
    });
  });

  it("같은 열의 내림차순은 오름차순으로 바뀐다", () => {
    expect(getNextSortState("price", "desc", "price")).toEqual({
      sort: "price",
      direction: "asc",
    });
  });

  it("같은 열의 오름차순은 정렬을 해제한다", () => {
    expect(getNextSortState("price", "asc", "price")).toEqual({
      sort: undefined,
      direction: undefined,
    });
  });
});
