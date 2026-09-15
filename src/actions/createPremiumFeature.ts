"use server";
import type { ApiResponse } from "@/core/domain/error";
import { PremiumFeatureSchema } from "@/core/schemas/request/premiumFeature.schema";
import { createPremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const createPremiumFeature = async (
  _prev: unknown,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  const data = {
    code: formData.get("code"),
    label: formData.get("label"),
    description: formData.get("description"),
    additionalPrice: Number(formData.get("additionalPrice")),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = validateAndFlatten(PremiumFeatureSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    await createPremiumFeatureAsAdminService(parsed.data);
    revalidatePath(ROUTES.admin.premiumFeatures.root);
    return {
      success: true,
      data: { message: "프리미엄 기능을 등록하였습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { createPremiumFeature };
