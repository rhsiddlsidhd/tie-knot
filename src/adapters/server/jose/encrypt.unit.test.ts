import { describe, expect, it } from "vitest";
import { jwtVerify } from "jose";
import { encrypt } from "./encrypt";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";

const ONE_MINUTE = 60;

describe("encrypt", () => {
  it("REFRESH 토큰은 JWT_ENCODED_KEY로 서명하고 id·role과 7일 만료를 담는다", async () => {
    const token = await encrypt({ type: "REFRESH", id: "user-1", role: "USER" });

    const { payload, protectedHeader } = await jwtVerify(token, JWT_ENCODED_KEY, {
      algorithms: ["HS256"],
    });

    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.id).toBe("user-1");
    expect(payload.role).toBe("USER");
    expect(payload.exp).toBeDefined();
    expect(payload.iat).toBeDefined();
    expect(payload.exp! - payload.iat!).toBeCloseTo(7 * 24 * 60 * 60, -1);
  });

  it("ENTRY 토큰에 id가 있으면 그대로 사용하고 role은 담지 않으며 10분 만료로 서명한다", async () => {
    const token = await encrypt({ type: "ENTRY", id: "guest-1" });

    const { payload } = await jwtVerify(token, ENTRY_ENCODED_KEY, {
      algorithms: ["HS256"],
    });

    expect(payload.id).toBe("guest-1");
    expect(payload.role).toBeUndefined();
    expect(payload.exp! - payload.iat!).toBeCloseTo(10 * ONE_MINUTE, -1);
  });

  it("ENTRY 토큰에 jti가 주어지면 페이로드에 그대로 담긴다", async () => {
    const token = await encrypt({
      type: "ENTRY",
      id: "guest-1",
      jti: "token-id-1",
    });

    const { payload } = await jwtVerify(token, ENTRY_ENCODED_KEY, {
      algorithms: ["HS256"],
    });

    expect(payload.jti).toBe("token-id-1");
  });

  it("ENTRY 토큰에 id가 없으면 기본값 entryToken을 id로 사용한다", async () => {
    const token = await encrypt({ type: "ENTRY" });

    const { payload } = await jwtVerify(token, ENTRY_ENCODED_KEY, {
      algorithms: ["HS256"],
    });

    expect(payload.id).toBe("entryToken");
  });

  it("REFRESH 토큰은 ENTRY_ENCODED_KEY로 검증할 수 없다", async () => {
    const token = await encrypt({ type: "REFRESH", id: "user-1", role: "USER" });

    await expect(
      jwtVerify(token, ENTRY_ENCODED_KEY, { algorithms: ["HS256"] }),
    ).rejects.toThrow();
  });
});
