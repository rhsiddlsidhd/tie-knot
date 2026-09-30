import { describe, expect, it } from "vitest";

import type { SortState } from "./sort-cycle";
import { getNextSortState } from "./sort-cycle";

type Key = "createdAt" | "price";

describe("getNextSortState", () => {
  it("다른 열을 선택하면 내림차순으로 시작한다", () => {
    const current: SortState<Key> = { key: "createdAt", direction: "asc" };

    expect(getNextSortState(current, "price")).toEqual({
      key: "price",
      direction: "desc",
    });
  });

  it("정렬되지 않은 상태에서 열을 선택하면 내림차순으로 시작한다", () => {
    expect(getNextSortState<Key>(null, "createdAt")).toEqual({
      key: "createdAt",
      direction: "desc",
    });
  });

  it("같은 열의 내림차순은 오름차순으로 바뀐다", () => {
    const current: SortState<Key> = { key: "price", direction: "desc" };

    expect(getNextSortState(current, "price")).toEqual({
      key: "price",
      direction: "asc",
    });
  });

  it("같은 열의 오름차순은 정렬을 해제한다", () => {
    const current: SortState<Key> = { key: "price", direction: "asc" };

    expect(getNextSortState(current, "price")).toBeNull();
  });
});
