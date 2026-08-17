"use server";

import { deleteCookie } from "@/adapters/cookies";
import { actionError } from "@/boundary";
import type { APIResponse } from "@/core/domain";

export const clearUserEmailCookie = async (): Promise<APIResponse<null>> => {
  try {
    await deleteCookie("userEmail");
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};
