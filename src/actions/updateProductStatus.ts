"use server";

import type { ApiResponse } from "@/core/domain/error";
import { updateProductStatusAsAdminService } from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";
import { EditableProductStatusSchema } from "@/core/schemas/request/product.schema";

import { revalidatePath } from "next/cache";

const updateProductStatus = async (
  productId: string,
  status: string,
): Promise<ApiResponse<{ message: string }>> => {
  const parsedStatus = EditableProductStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "변경할 수 없는 상품 상태입니다.",
      },
    };
  }

  try {
    const updated = await updateProductStatusAsAdminService(
      productId,
      parsedStatus.data,
    );

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
