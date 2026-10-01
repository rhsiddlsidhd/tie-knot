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
    // 가용 서브카테고리 집합이 바뀌면 홈의 카테고리 둘러보기와 헤더 nav가
    // 같이 틀어진다 — 홈은 ISR(600초)이라 재검증하지 않으면 그동안 죽은
    // 링크가 남는다.
    revalidatePath(ROUTES.home);

    return {
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { deleteProduct };
