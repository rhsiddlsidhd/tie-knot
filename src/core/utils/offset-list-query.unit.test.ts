import { describe, expect, it } from "vitest";
import { buildOffsetListKey, parseOffsetListQuery } from "./offset-list-query";

const SORT_KEYS = ["createdAt", "price"] as const;
const VIEWS = ["active", "trash"] as const;

const parseQuery = (query: string) =>
  parseOffsetListQuery(new URLSearchParams(query), {
    sortKeys: SORT_KEYS,
    params: { view: VIEWS },
  });

describe("offset list query", () => {
  it("URL 값을 검증하고 정해진 순서의 SWR key를 만든다", () => {
    const state = parseQuery(
      "view=trash&direction=asc&q=웨딩 카드&page=3&sort=price&unused=x",
    );

    expect(state).toEqual({
      page: 3,
      q: "웨딩 카드",
      sortState: { key: "price", direction: "asc" },
      params: { view: "trash" },
      namesToRemove: [],
    });
    expect(buildOffsetListKey("/api/admin/products", state)).toBe(
      "/api/admin/products?page=3&q=%EC%9B%A8%EB%94%A9+%EC%B9%B4%EB%93%9C&sort=price&direction=asc&view=trash",
    );
  });

  it("허용되지 않은 값은 기본 상태로 바꾸고 정리 대상으로 표시한다", () => {
    const state = parseQuery("page=bogus&sort=bogus&direction=asc&view=bogus");

    expect(state).toEqual({
      page: 1,
      q: "",
      sortState: null,
      params: { view: null },
      namesToRemove: ["page", "sort", "direction", "view"],
    });
    expect(buildOffsetListKey("/api/admin/products", state)).toBe(
      "/api/admin/products?page=1",
    );
  });

  it("잘못된 direction은 기본 내림차순으로 읽고 정리 대상으로 표시한다", () => {
    const state = parseQuery("sort=price&direction=sideways");

    expect(state.sortState).toEqual({ key: "price", direction: "desc" });
    expect(state.namesToRemove).toEqual(["direction"]);
    expect(buildOffsetListKey("/api/admin/products", state)).toBe(
      "/api/admin/products?page=1&sort=price&direction=desc",
    );
  });

  it("기본 page 값은 URL에서 생략할 정리 대상으로 표시한다", () => {
    expect(parseQuery("page=1").namesToRemove).toEqual(["page"]);
  });
});
