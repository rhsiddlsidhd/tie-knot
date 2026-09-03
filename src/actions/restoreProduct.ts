"use server";

import type { APIResponse } from "@/core/domain/error";
import { restoreProductAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

export const restoreProduct = async (
  productId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await restoreProductAsAdminService(productId);

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 복구되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
