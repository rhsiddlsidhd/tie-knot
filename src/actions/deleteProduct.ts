"use server";

import type { ApiResponse } from "@/core/domain/error";
import { deleteProductAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

const deleteProduct = async (
  productId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await deleteProductAsAdminService(productId);

    revalidatePath(ROUTES.admin.products.root);
    revalidatePath(ROUTES.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { deleteProduct };
