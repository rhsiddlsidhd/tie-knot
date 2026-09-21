import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: vi.fn() }));

import { fetcher } from "@/ui/fetcher";
import { useBanks } from "./useBanks";

describe("useBanks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("고정된 은행 목록 key와 fetcher로 swr을 호출한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    renderHook(() => useBanks());

    expect(useSWRMock).toHaveBeenCalledWith("/api/banks", fetcher);
  });

  it("로딩 중에는 banks가 없고 isLoading이 true다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useBanks());

    expect(result.current.banks).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBeUndefined();
  });

  it("응답이 도착하면 banks로 노출한다", () => {
    const banks = [{ bank: "004", name: { ko: "국민은행" } }];
    useSWRMock.mockReturnValue({
      data: banks,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useBanks());

    expect(result.current.banks).toEqual(banks);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBeUndefined();
  });

  it("에러가 있으면 isError로 노출한다", () => {
    const error = {
      category: "EXTERNAL_SERVICE",
      message: "은행 목록 조회 실패",
    };
    useSWRMock.mockReturnValue({ data: undefined, error, isLoading: false });

    const { result } = renderHook(() => useBanks());

    expect(result.current.isError).toEqual(error);
    expect(result.current.banks).toBeUndefined();
  });
});
