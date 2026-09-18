"use server";

import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/core/domain/error";
import { toggleProductLikeForCurrentUserService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

const toggleProductLike = async (
  productId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await toggleProductLikeForCurrentUserService(productId);

    revalidatePath(ROUTES.products.root);

    return {
      success: true,
      data: { message: "좋아요 업데이트에 성공하였습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { toggleProductLike };
