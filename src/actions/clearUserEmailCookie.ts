"use server";

import { clearUserEmailCookieService } from "@/services";
import { actionError } from "@/boundary";
import type { APIResponse } from "@/core/domain";

export const clearUserEmailCookie = async (): Promise<APIResponse<null>> => {
  try {
    await clearUserEmailCookieService();
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};
