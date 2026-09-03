import { describe, it, expect, vi, afterEach } from "vitest";

import { getCurrentCoordinates } from "./current-position";

describe("getCurrentCoordinates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("좌표를 lat/lng 형태로 정규화해 돌려준다", async () => {
    const getCurrentPosition = vi.fn((success) => {
      success({ coords: { latitude: 37.5, longitude: 127.0 } });
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    await expect(getCurrentCoordinates()).resolves.toEqual({
      lat: 37.5,
      lng: 127.0,
    });
  });

  it("권한 거부 등으로 실패하면 throw하지 않고 null로 떨어뜨린다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const getCurrentPosition = vi.fn((_success, error) => {
      error(new Error("denied"));
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    await expect(getCurrentCoordinates()).resolves.toBeNull();

    errorSpy.mockRestore();
  });
});
