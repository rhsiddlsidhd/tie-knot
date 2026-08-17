"use server";

import type { APIResponse } from "@/core/domain";
import { deleteProductAsAdminService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";

import { revalidatePath } from "next/cache";

export const deleteProduct = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await deleteProductAsAdminService(productId);

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
