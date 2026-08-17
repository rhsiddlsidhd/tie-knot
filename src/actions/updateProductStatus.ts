"use server";

import type { APIResponse } from "@/core/domain";
import type { ProductStatus } from "@/core/domain";
import { updateProductStatusAsAdminService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";

import { revalidatePath } from "next/cache";

export const updateProductStatus = async (
  productId: string,
  status: ProductStatus,
): Promise<APIResponse<{ message: string }>> => {
  try {
    const updated = await updateProductStatusAsAdminService(productId, status);

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);
    revalidatePath(routes.products.detail(updated.category, productId));

    return {
      success: true,
      data: { message: "상품 상태가 변경되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
