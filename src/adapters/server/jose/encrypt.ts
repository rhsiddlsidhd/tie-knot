import "server-only";
import { SignJWT } from "jose";
import type { EncryptProps } from "./type";
import { ENTRY_ENCODED_KEY, JWT_ENCODED_KEY } from "./config";

const EXPIRATION_BY_TYPE = {
  REFRESH: "7d",
  ENTRY: "10m",
} as const satisfies Record<EncryptProps["type"], string>;

const encrypt = async (payload: EncryptProps) => {
  const jwt = new SignJWT({
    id:
      payload.type !== "ENTRY"
        ? payload.id
        : payload.type === "ENTRY" && payload.id
          ? payload.id
          : "entryToken",
    role: payload.type !== "ENTRY" ? payload.role : undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION_BY_TYPE[payload.type]);

  if (payload.type === "ENTRY" && payload.jti) {
    jwt.setJti(payload.jti);
  }

  return await jwt.sign(
    payload.type !== "ENTRY" ? JWT_ENCODED_KEY : ENTRY_ENCODED_KEY,
  );
};

export { encrypt };
