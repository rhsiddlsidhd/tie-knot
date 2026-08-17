"use server";

import { incrementProductViewsService } from "@/services";
import { actionError } from "@/server/boundary";
import type { APIResponse } from "@/core/domain";

export const incrementProductViews = async (
  productId: string,
): Promise<APIResponse<{ success: boolean }>> => {
  try {
    const success = await incrementProductViewsService(productId);
    return { success: true, data: { success } };
  } catch (e) {
    return actionError(e);
  }
};
