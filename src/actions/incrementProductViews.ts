"use server";

import { incrementProductViewsService } from "@/services/product";
import { actionError } from "@/boundary";
import type { APIResponse } from "@/core/domain/error";

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
