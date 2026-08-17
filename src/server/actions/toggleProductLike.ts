"use server";

import { revalidatePath } from "next/cache";
import type { APIResponse} from "@/core/domain";
import { AppError } from "@/core/domain";
import { requireAuth, updateProductLikeService } from "@/server/services";
import { actionError } from "@/server/boundary";
import { routes } from "@/core/domain";

export const toggleProductLike = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const { userId } = await requireAuth();

    const updated = await updateProductLikeService(productId, userId);
    if (!updated) {
      throw new AppError(
        "NOT_FOUND",
        "상품을 찾을 수 없거나 좋아요 업데이트에 실패했습니다.",
      );
    }

    revalidatePath(routes.products.root);

    return { success: true, data: { message: "좋아요 업데이트에 성공하였습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
