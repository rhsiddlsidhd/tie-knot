import { describe, it, expect, afterEach, vi } from "vitest";
import { getAppBaseUrl } from "./url";

describe("getAppBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("개발 환경이면 BASE_URL을 사용한다", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BASE_URL", "http://localhost:3000");
    vi.stubEnv("DEPLOYMENT_BASE_URL", "https://tie-knot-pi.vercel.app");

    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("개발 환경이 아니면 DEPLOYMENT_BASE_URL을 사용한다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BASE_URL", "http://localhost:3000");
    vi.stubEnv("DEPLOYMENT_BASE_URL", "https://tie-knot-pi.vercel.app");

    expect(getAppBaseUrl()).toBe("https://tie-knot-pi.vercel.app");
  });

  it("선택된 환경변수가 없으면 AppError(INTERNAL)를 던진다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_BASE_URL", "");

    expect(() => getAppBaseUrl()).toThrowError(
      expect.objectContaining({ category: "INTERNAL" }),
    );
  });
});
