import "server-only";
import { cookies } from "next/headers";
import type { CookieName } from "./type";

export const deleteCookie = async (key: CookieName): Promise<void> => {
  const store = await cookies();
  store.delete(key);
};
