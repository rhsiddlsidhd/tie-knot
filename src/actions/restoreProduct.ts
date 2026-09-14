"use server";

import type { ApiResponse } from "@/core/domain/error";
import { restoreProductAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

const restoreProduct = async (
  productId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await restoreProductAsAdminService(productId);

    revalidatePath(ROUTES.admin.products.root);
    revalidatePath(ROUTES.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 복구되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { restoreProduct };
