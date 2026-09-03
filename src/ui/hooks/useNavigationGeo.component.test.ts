import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("./useKakaomapGeocode", () => ({
  useKakaomapGeocode: vi.fn(),
}));

vi.mock("@/adapters/browser/geolocation/current-position", () => ({
  getCurrentCoordinates: vi.fn(),
}));

import { useKakaomapGeocode } from "./useKakaomapGeocode";
import { getCurrentCoordinates } from "@/adapters/browser/geolocation/current-position";
import { useNavigationGeo } from "./useNavigationGeo";

describe("useNavigationGeo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKakaomapGeocode).mockReturnValue({ lat: 37.5, lng: 127.0 });
    vi.mocked(getCurrentCoordinates).mockResolvedValue(null);
  });

  it("현재 위치를 가져와 current에 반영한다", async () => {
    vi.mocked(getCurrentCoordinates).mockResolvedValue({ lat: 37.5, lng: 127.0 });

    const { result } = renderHook(() => useNavigationGeo("서울"));

    await waitFor(() => {
      expect(result.current.current).toEqual({ lat: 37.5, lng: 127.0 });
    });
  });

  it("위치 조회가 null이면 current를 초기값으로 유지한다", async () => {
    const { result } = renderHook(() => useNavigationGeo("서울"));

    await waitFor(() => {
      expect(getCurrentCoordinates).toHaveBeenCalled();
    });
    expect(result.current.current).toEqual({ lat: null, lng: null });
  });

  it("target은 useKakaomapGeocode 결과를 그대로 전달한다", () => {
    const { result } = renderHook(() => useNavigationGeo("서울"));

    expect(useKakaomapGeocode).toHaveBeenCalledWith("서울");
    expect(result.current.target).toEqual({ lat: 37.5, lng: 127.0 });
  });
});
