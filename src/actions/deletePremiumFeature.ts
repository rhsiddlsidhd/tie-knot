"use server";

import type { ApiResponse } from "@/core/domain/error";
import { deletePremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";

const deletePremiumFeature = async (
  featureId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await deletePremiumFeatureAsAdminService(featureId);

    revalidatePath(ROUTES.admin.premiumFeatures.root);

    return {
      success: true,
      data: { message: "프리미엄 기능이 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { deletePremiumFeature };
