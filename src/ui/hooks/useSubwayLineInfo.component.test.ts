import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { useSWRMock } = vi.hoisted(() => ({ useSWRMock: vi.fn() }));
const { fetcherMock } = vi.hoisted(() => ({ fetcherMock: vi.fn() }));

vi.mock("swr", () => ({ default: useSWRMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: fetcherMock }));

import { useSubwayLineInfo } from "./useSubwayLineInfo";

describe("useSubwayLineInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("station이 없으면 swr key를 null로 전달한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSubwayLineInfo());

    expect(useSWRMock).toHaveBeenCalledWith(null, expect.any(Function), {
      shouldRetryOnError: false,
    });
  });

  it("station이 있으면 encode된 역 이름으로 swr key를 만든다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    renderHook(() => useSubwayLineInfo("강남 역"));

    expect(useSWRMock).toHaveBeenCalledWith(
      `/api/subway/${encodeURIComponent("강남 역")}`,
      expect.any(Function),
      { shouldRetryOnError: false },
    );
  });

  it("swr에 전달한 fetcher 함수는 fetcher(url)을 그대로 호출한다", () => {
    useSWRMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useSubwayLineInfo("강남역"));

    const fetcherArg = useSWRMock.mock.calls[0][1] as (url: string) => unknown;
    fetcherArg("/api/subway/강남역");

    expect(fetcherMock).toHaveBeenCalledWith("/api/subway/강남역");
  });

  it("응답이 도착하면 lineInfo로 노출한다", () => {
    const lineInfo = {
      station: "강남역",
      lines: [{ name: "2호선", color: "#00A84D" }],
    };
    useSWRMock.mockReturnValue({
      data: lineInfo,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useSubwayLineInfo("강남역"));

    expect(result.current.lineInfo).toEqual(lineInfo);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBeUndefined();
  });

  it("에러가 있으면 isError로 노출한다", () => {
    const error = { category: "EXTERNAL_SERVICE", message: "노선 조회 실패" };
    useSWRMock.mockReturnValue({ data: undefined, error, isLoading: false });

    const { result } = renderHook(() => useSubwayLineInfo("강남역"));

    expect(result.current.isError).toEqual(error);
    expect(result.current.lineInfo).toBeUndefined();
  });
});
