"use server";

import { revalidatePath } from "next/cache";
import type { APIResponse} from "@/core/domain";
import { toggleProductLikeForCurrentUserService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";

export const toggleProductLike = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await toggleProductLikeForCurrentUserService(productId);

    revalidatePath(routes.products.root);

    return { success: true, data: { message: "좋아요 업데이트에 성공하였습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
