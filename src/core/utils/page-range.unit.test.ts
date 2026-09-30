import { describe, expect, it } from "vitest";

import { getPageRange } from "./page-range";

describe("getPageRange", () => {
  it("페이지가 없으면 빈 목록을 반환한다", () => {
    expect(getPageRange(1, 0)).toEqual([]);
  });

  it("한 페이지뿐이면 생략 기호 없이 반환한다", () => {
    expect(getPageRange(1, 1)).toEqual([1]);
  });

  it("짧은 범위는 모든 페이지를 반환한다", () => {
    expect(getPageRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it.each([
    [1, [1, 2, "ellipsis", 20]],
    [3, [1, 2, 3, 4, "ellipsis", 20]],
    [4, [1, 2, 3, 4, 5, "ellipsis", 20]],
    [10, [1, "ellipsis", 9, 10, 11, "ellipsis", 20]],
    [17, [1, "ellipsis", 16, 17, 18, 19, 20]],
    [20, [1, "ellipsis", 19, 20]],
  ])("현재 페이지가 %i일 때 필요한 범위만 생략한다", (page, expected) => {
    expect(getPageRange(page, 20)).toEqual(expected);
  });
});
