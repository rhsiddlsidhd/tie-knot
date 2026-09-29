import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/admin/products",
  searchParams: new URLSearchParams(),
}));
const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => navigationMocks.searchParams,
}));
vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: vi.fn() }));

import { useOffsetList } from "./useOffsetList";

const mutate = vi.fn();
const pushStateSpy = vi
  .spyOn(window.history, "pushState")
  .mockImplementation(() => undefined);
const replaceStateSpy = vi
  .spyOn(window.history, "replaceState")
  .mockImplementation(() => undefined);

const mockSWR = (data?: {
  items: { id: string }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}) => {
  useSWRMock.mockReturnValue({
    data,
    error: undefined,
    isLoading: data === undefined,
    isValidating: false,
    mutate,
  });
};

describe("useOffsetList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.pathname = "/admin/products";
    navigationMocks.searchParams = new URLSearchParams();
    mockSWR();
  });

  afterAll(() => {
    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
  });

  it("정해진 순서로 빈 값을 제외한 SWR key를 만든다", () => {
    navigationMocks.searchParams = new URLSearchParams(
      "view=trash&direction=asc&q=웨딩 카드&page=3&sort=price&unused=x",
    );

    renderHook(() =>
      useOffsetList<{ id: string }, "createdAt" | "price">({
        endpoint: "/api/admin/products",
        params: ["view"],
      }),
    );

    expect(useSWRMock).toHaveBeenCalledWith(
      "/api/admin/products?page=3&q=%EC%9B%A8%EB%94%A9+%EC%B9%B4%EB%93%9C&sort=price&direction=asc&view=trash",
      expect.any(Function),
      { keepPreviousData: true },
    );
  });

  it("URL 기본값과 SWR 응답 상태를 노출한다", () => {
    const data = {
      items: [{ id: "product-1" }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    mockSWR(data);

    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
        params: ["view"],
      }),
    );

    expect(result.current).toMatchObject({
      items: data.items,
      pageInfo: { total: 1, totalPages: 1 },
      page: 1,
      q: "",
      sortState: null,
      params: { view: undefined },
      isLoading: false,
    });
    expect(result.current.mutate).toBe(mutate);
  });

  it("응답 전에는 pageInfo를 null로 둔다", () => {
    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );

    expect(result.current.pageInfo).toBeNull();
    expect(result.current.items).toBeUndefined();
  });

  it("URL의 sort와 direction을 하나의 정렬 상태로 노출한다", () => {
    navigationMocks.searchParams = new URLSearchParams(
      "sort=createdAt&direction=asc",
    );
    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );

    expect(result.current.sortState).toEqual({
      key: "createdAt",
      direction: "asc",
    });
  });

  it("페이지 이동은 기본 page를 URL에서 빼고 push한다", () => {
    navigationMocks.searchParams = new URLSearchParams("q=카드&page=3");
    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );

    act(() => result.current.setPage(1));

    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/admin/products?q=%EC%B9%B4%EB%93%9C",
    );
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it("검색 변경은 값을 trim하고 page를 제거해 replace한다", () => {
    navigationMocks.searchParams = new URLSearchParams("page=4&view=trash");
    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
        params: ["view"],
      }),
    );

    act(() => result.current.setSearch("  웨딩 카드  "));

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/admin/products?view=trash&q=%EC%9B%A8%EB%94%A9+%EC%B9%B4%EB%93%9C",
    );
  });

  it("정렬은 desc에서 시작해 asc를 거쳐 해제하며 page를 제거한다", () => {
    navigationMocks.searchParams = new URLSearchParams("page=2");
    const first = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );

    act(() => first.result.current.toggleSort("createdAt"));
    expect(replaceStateSpy).toHaveBeenLastCalledWith(
      null,
      "",
      "/admin/products?sort=createdAt&direction=desc",
    );

    first.unmount();
    navigationMocks.searchParams = new URLSearchParams(
      "sort=createdAt&direction=desc&page=2",
    );
    const second = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );
    act(() => second.result.current.toggleSort("createdAt"));
    expect(replaceStateSpy).toHaveBeenLastCalledWith(
      null,
      "",
      "/admin/products?sort=createdAt&direction=asc",
    );

    second.unmount();
    navigationMocks.searchParams = new URLSearchParams(
      "sort=createdAt&direction=asc&page=2",
    );
    const third = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );
    act(() => third.result.current.toggleSort("createdAt"));
    expect(replaceStateSpy).toHaveBeenLastCalledWith(
      null,
      "",
      "/admin/products",
    );
  });

  it("전용 파라미터 변경은 page를 제거하고 undefined 값은 삭제한다", () => {
    navigationMocks.searchParams = new URLSearchParams("page=3&view=trash");
    const { result } = renderHook(() =>
      useOffsetList<{ id: string }, "createdAt", "view">({
        endpoint: "/api/admin/products",
        params: ["view"],
      }),
    );

    act(() => result.current.setParam("view", undefined));

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/admin/products",
    );
  });

  it("응답 범위를 넘은 page는 마지막 페이지로 replace한다", async () => {
    navigationMocks.searchParams = new URLSearchParams("page=8&q=카드");
    mockSWR({ items: [], total: 45, page: 8, limit: 10, totalPages: 5 });

    renderHook(() =>
      useOffsetList<{ id: string }, "createdAt">({
        endpoint: "/api/admin/products",
      }),
    );

    await waitFor(() =>
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        "",
        "/admin/products?page=5&q=%EC%B9%B4%EB%93%9C",
      ),
    );
  });

  it("빈 결과의 page가 1보다 크면 page를 제거한다", async () => {
    navigationMocks.searchParams = new URLSearchParams("page=4&view=trash");
    mockSWR({ items: [], total: 0, page: 4, limit: 10, totalPages: 0 });

    renderHook(() =>
      useOffsetList<{ id: string }, "createdAt", "view">({
        endpoint: "/api/admin/products",
        params: ["view"],
      }),
    );

    await waitFor(() =>
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        "",
        "/admin/products?view=trash",
      ),
    );
  });
});
