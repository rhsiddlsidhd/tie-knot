"use server";

import type { ApiResponse } from "@/core/domain/error";
import type { ProductStatus } from "@/core/domain/product";
import { updateProductStatusAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

const updateProductStatus = async (
  productId: string,
  status: ProductStatus,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const updated = await updateProductStatusAsAdminService(productId, status);

    revalidatePath(ROUTES.admin.products.root);
    revalidatePath(ROUTES.products.root);
    revalidatePath(ROUTES.products.detail(updated.category, productId));

    return {
      success: true,
      data: { message: "상품 상태가 변경되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { updateProductStatus };
