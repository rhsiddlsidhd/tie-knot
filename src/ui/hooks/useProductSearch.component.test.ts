import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: vi.fn() }));

import type { Product } from "@/core/domain/product";
import { useProductSearch } from "./useProductSearch";

const swrOptions = { keepPreviousData: true, revalidateOnFocus: false };

describe("useProductSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("검색어가 비어있으면 swr key를 null로 전달하고 idle 상태를 노출한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useProductSearch(""));

    expect(useSWRMock).toHaveBeenCalledWith(null, expect.any(Function), swrOptions);
    expect(result.current.isIdle).toBe(true);
    expect(result.current.products).toBeUndefined();
  });

  it("공백만 있는 검색어도 idle 상태로 취급한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useProductSearch("   "));

    expect(useSWRMock).toHaveBeenCalledWith(null, expect.any(Function), swrOptions);
    expect(result.current.isIdle).toBe(true);
  });

  it("검색어가 있으면 encode된 검색 key로 요청하고 idle이 아니다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
    });

    const { result } = renderHook(() => useProductSearch("웨딩 청첩장"));

    expect(useSWRMock).toHaveBeenCalledWith(
      `/api/products/search?q=${encodeURIComponent("웨딩 청첩장")}`,
      expect.any(Function),
      swrOptions,
    );
    expect(result.current.isIdle).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isValidating).toBe(true);
  });

  it("검색어 앞뒤 공백은 trim해 swr key를 만든다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    renderHook(() => useProductSearch("  청첩장  "));

    expect(useSWRMock).toHaveBeenCalledWith(
      `/api/products/search?q=${encodeURIComponent("청첩장")}`,
      expect.any(Function),
      swrOptions,
    );
  });

  it("응답 결과를 products로 노출한다", () => {
    const products = [{ _id: "p1", title: "청첩장" }] as unknown as Product[];
    useSWRMock.mockReturnValue({
      data: products,
      error: undefined,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useProductSearch("청첩장"));

    expect(result.current.products).toEqual(products);
  });

  it("에러가 있으면 error로 노출한다", () => {
    const error = { category: "INTERNAL", message: "검색 실패" };
    useSWRMock.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
    });

    const { result } = renderHook(() => useProductSearch("청첩장"));

    expect(result.current.error).toEqual(error);
  });
});
