"use server";
import type { APIResponse } from "@/core/domain";
import { premiumFeatureSchema } from "@/core/schemas";
import { createPremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const createPremiumFeature = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    code: formData.get("code"),
    label: formData.get("label"),
    description: formData.get("description"),
    additionalPrice: Number(formData.get("additionalPrice")),
  };

  const parsed = validateAndFlatten(premiumFeatureSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력 값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    await createPremiumFeatureAsAdminService(parsed.data);
    revalidatePath(routes.admin.premiumFeatures.root);
    return { success: true, data: { message: "프리미엄 기능을 등록하였습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
