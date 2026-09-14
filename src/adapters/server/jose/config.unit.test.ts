import { afterEach, describe, expect, it, vi } from "vitest";

describe("jose config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("JWT_SECRET과 ENTRY_JWT_SECRET을 각각 TextEncoder로 인코딩해 export한다", async () => {
    vi.stubEnv("JWT_SECRET", "test-jwt-secret");
    vi.stubEnv("ENTRY_JWT_SECRET", "test-entry-secret");
    vi.resetModules();

    const { JWT_ENCODED_KEY, ENTRY_ENCODED_KEY } = await import("./config");

    expect(JWT_ENCODED_KEY).toEqual(
      new TextEncoder().encode("test-jwt-secret"),
    );
    expect(ENTRY_ENCODED_KEY).toEqual(
      new TextEncoder().encode("test-entry-secret"),
    );
  });

  it("JWT_SECRET이 비어있으면 모듈 로드 시점에 에러를 던진다", async () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("ENTRY_JWT_SECRET", "test-entry-secret");
    vi.resetModules();

    await expect(import("./config")).rejects.toThrow(
      "JWT_SECRET is not defined",
    );
  });

  it("ENTRY_JWT_SECRET이 비어있으면 모듈 로드 시점에 에러를 던진다", async () => {
    vi.stubEnv("JWT_SECRET", "test-jwt-secret");
    vi.stubEnv("ENTRY_JWT_SECRET", "");
    vi.resetModules();

    await expect(import("./config")).rejects.toThrow(
      "ENTRY_JWT_SECRET is not defined",
    );
  });
});
