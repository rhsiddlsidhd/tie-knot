"use server";

import { incrementProductViewsService } from "@/services/product";
import { actionError } from "@/boundary";
import type { ApiResponse } from "@/core/domain/error";

const incrementProductViews = async (
  productId: string,
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const success = await incrementProductViewsService(productId);
    return { success: true, data: { success } };
  } catch (e) {
    return actionError(e);
  }
};

export { incrementProductViews };
