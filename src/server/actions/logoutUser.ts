"use server";

import { logoutService } from "@/server/services";
import { actionError } from "@/server/boundary";
import type { APIResponse } from "@/core/domain";

export const logoutUser = async (): Promise<APIResponse<null>> => {
  try {
    await logoutService();
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};
