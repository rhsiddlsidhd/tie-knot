"use server";

import type { APIResponse } from "@/core/domain";
import { permanentlyDeleteProductAsAdminService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";

import { revalidatePath } from "next/cache";

export const permanentlyDeleteProduct = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await permanentlyDeleteProductAsAdminService(productId);

    revalidatePath(routes.admin.products.root);

    return {
      success: true,
      data: { message: "상품이 영구적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
