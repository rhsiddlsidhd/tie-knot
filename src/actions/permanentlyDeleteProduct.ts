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

    // 관리자 목록만 재검증한다 — 영구 삭제는 이미 soft delete된 상품만 대상이라
    // (permanentlyDeleteProductService가 `deletedAt: { $ne: null }`로 조회) 공개
    // 카탈로그와 홈의 가용 서브카테고리 집합에는 이 시점에 바뀌는 것이 없다.
    // 다른 상품 mutation 5종이 products.root·home까지 재검증하는 것과의 차이는
    // 누락이 아니라 이 조건 때문이다.
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
