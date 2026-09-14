import "server-only";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import type { CookieName } from "./type";

const getCookie = async (
  key: CookieName,
): Promise<RequestCookie | undefined> => {
  const store = await cookies();
  return store.get(key);
};

export { getCookie };
