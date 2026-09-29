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

  it("첫 페이지 근처는 뒤쪽 범위만 생략한다", () => {
    expect(getPageRange(1, 20)).toEqual([1, 2, "ellipsis", 20]);
  });

  it("마지막 페이지 근처는 앞쪽 범위만 생략한다", () => {
    expect(getPageRange(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });

  it("가운데 페이지는 양쪽 범위를 생략한다", () => {
    expect(getPageRange(6, 20)).toEqual([
      1,
      "ellipsis",
      5,
      6,
      7,
      "ellipsis",
      20,
    ]);
  });
});
