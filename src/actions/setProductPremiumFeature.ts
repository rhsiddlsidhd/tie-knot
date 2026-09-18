"use server";

import type { ApiResponse } from "@/core/domain/error";
import {
  attachPremiumFeatureToProductService,
  detachPremiumFeatureFromProductService,
} from "@/services/product";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

/**
 * 기능↔상품 연결을 행 단위로 즉시 반영한다. 목록이 URL(`?q=`/`?cursor=`)로 페이징되어
 * 선택 상태를 클라이언트에 모아둘 수 없기 때문이다 — 서버가 유일한 진실이다.
 *
 * 상품 문서 하나만 쓰므로 트랜잭션이 필요 없다.
 */
const setProductPremiumFeature = async ({
  productId,
  featureId,
  attached,
}: {
  productId: string;
  featureId: string;
  attached: boolean;
}): Promise<ApiResponse<{ message: string }>> => {
  try {
    if (attached) {
      await attachPremiumFeatureToProductService(productId, featureId);
    } else {
      await detachPremiumFeatureFromProductService(productId, featureId);
    }

    revalidatePath(ROUTES.admin.premiumFeatures.products(featureId));

    return {
      success: true,
      data: {
        message: attached
          ? "상품에 기능을 연결했습니다."
          : "상품에서 기능을 해제했습니다.",
      },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { setProductPremiumFeature };
