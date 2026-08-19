import "server-only";
import type { JWTPayload, JWTVerifyResult } from "jose";
import { jwtVerify } from "jose";
import type { DecryptProps, EncryptProps } from "./type";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";
import { AppError } from "@/core/domain";

interface ExtractedPayload extends JWTPayload, Omit<EncryptProps, "type"> {}

export async function decrypt(
  args: DecryptProps,
): Promise<JWTVerifyResult<ExtractedPayload>> {
  const { token, type } = args;

  const key = type !== "ENTRY" ? JWT_ENCODED_KEY : ENTRY_ENCODED_KEY;

  try {
    return await jwtVerify<ExtractedPayload>(token, key, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ERR_JWT_EXPIRED"
    ) {
      throw new AppError(
        "UNAUTHENTICATED",
        "유효하지 않거나 만료된 토큰입니다. 다시 로그인해주세요.",
      );
    }
    throw error;
  }
}
