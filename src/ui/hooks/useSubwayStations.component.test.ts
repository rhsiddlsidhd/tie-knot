import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: vi.fn() }));

import { fetcher } from "@/ui/fetcher";
import { useSubwayStations } from "./useSubwayStations";

describe("useSubwayStations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("고정된 역 목록 key와 fetcher, 재시도 안 함 옵션으로 swr을 호출한다", () => {
    useSWRMock.mockReturnValue({ data: undefined, error: undefined, isLoading: true });

    renderHook(() => useSubwayStations());

    expect(useSWRMock).toHaveBeenCalledWith("/api/subway", fetcher, {
      shouldRetryOnError: false,
    });
  });

  it("로딩 중에는 subwayStations가 없고 isLoading이 true다", () => {
    useSWRMock.mockReturnValue({ data: undefined, error: undefined, isLoading: true });

    const { result } = renderHook(() => useSubwayStations());

    expect(result.current.subwayStations).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBeUndefined();
  });

  it("응답이 도착하면 subwayStations로 노출한다", () => {
    const stations = [{ value: "강남역", label: "강남역" }];
    useSWRMock.mockReturnValue({ data: stations, error: undefined, isLoading: false });

    const { result } = renderHook(() => useSubwayStations());

    expect(result.current.subwayStations).toEqual(stations);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBeUndefined();
  });

  it("에러가 있으면 isError로 노출한다", () => {
    const error = { category: "EXTERNAL_SERVICE", message: "역 목록 조회 실패" };
    useSWRMock.mockReturnValue({ data: undefined, error, isLoading: false });

    const { result } = renderHook(() => useSubwayStations());

    expect(result.current.isError).toEqual(error);
    expect(result.current.subwayStations).toBeUndefined();
  });
});
