"use server";

import { clearUserEmailCookieService } from "@/services/auth";
import { actionError } from "@/boundary";
import type { ApiResponse } from "@/core/domain/error";

const clearUserEmailCookie = async (): Promise<ApiResponse<null>> => {
  try {
    await clearUserEmailCookieService();
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};

export { clearUserEmailCookie };
