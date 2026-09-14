"use server";

import { logoutService } from "@/services/auth";
import { actionError } from "@/boundary";
import type { ApiResponse } from "@/core/domain/error";

const logoutUser = async (): Promise<ApiResponse<null>> => {
  try {
    await logoutService();
    return { success: true, data: null };
  } catch (e) {
    return actionError(e);
  }
};

export { logoutUser };
