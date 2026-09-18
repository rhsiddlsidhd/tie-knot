import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { decrypt } from "./decrypt";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";
import { AppError } from "@/core/domain/error";

const signToken = (
  key: Uint8Array,
  claims: Record<string, unknown>,
  expirationTime: string | number = "10m",
) => {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(key);
}

describe("decrypt", () => {
  it("REFRESH 토큰이 유효하면 JWT_ENCODED_KEY로 검증해 payload를 반환한다", async () => {
    const token = await signToken(JWT_ENCODED_KEY, {
      id: "user-1",
      role: "USER",
    });

    const result = await decrypt({ token, type: "REFRESH" });

    expect(result.payload.id).toBe("user-1");
    expect(result.payload.role).toBe("USER");
  });

  it("ENTRY 토큰이 유효하면 ENTRY_ENCODED_KEY로 검증해 payload를 반환한다", async () => {
    const token = await signToken(ENTRY_ENCODED_KEY, { id: "guest-1" });

    const result = await decrypt({ token, type: "ENTRY" });

    expect(result.payload.id).toBe("guest-1");
  });

  it("만료된 토큰은 UNAUTHENTICATED AppError로 변환한다", async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 10;
    const token = await signToken(
      JWT_ENCODED_KEY,
      { id: "user-1", role: "USER" },
      expiredTimestamp,
    );

    await expect(decrypt({ token, type: "REFRESH" })).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(decrypt({ token, type: "REFRESH" })).rejects.toMatchObject({
      category: "UNAUTHENTICATED",
    });
  });

  it("서명 검증에 실패하면(만료가 아니면) 원본 오류를 그대로 전파한다", async () => {
    const token = await signToken(JWT_ENCODED_KEY, {
      id: "user-1",
      role: "USER",
    });

    await expect(
      decrypt({ token, type: "ENTRY" }),
    ).rejects.not.toBeInstanceOf(AppError);
  });
});
