"use server";

import type { ApiResponse } from "@/core/domain/error";
import { permanentlyDeleteProductAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

const permanentlyDeleteProduct = async (
  productId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await permanentlyDeleteProductAsAdminService(productId);

    revalidatePath(ROUTES.admin.products.root);

    return {
      success: true,
      data: { message: "상품이 영구적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { permanentlyDeleteProduct };
