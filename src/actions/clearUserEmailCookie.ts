"use server";

import { clearUserEmailCookieService } from "@/services/auth";
import { actionError } from "@/boundary";
import type { APIResponse } from "@/core/domain/error";

export const clearUserEmailCookie = async (): Promise<APIResponse<null>> => {
  try {
    await clearUserEmailCookieService();
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};
