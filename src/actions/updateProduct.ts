"use server";

import type { APIResponse } from "@/core/domain";
import { updateProductWorkflow } from "@/services";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils";

import { productSchema } from "@/core/schemas";
import { routes } from "@/core/domain";

import { revalidatePath } from "next/cache";

// 빈 문자열/null이면 undefined를 넘겨 zod .default()가 동작하게 한다 —
// Number(null)===0 / Number("")===0으로 파싱되면 min(1) 검증에 걸린다.
const parseOptionalNumber = (raw: FormDataEntryValue | null): number | undefined =>
  raw ? Number(raw) : undefined;

export const updateProduct = async (
  productId: string,
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    title: formData.get("title"),
    category: formData.get("category"),
    subCategory: formData.get("subCategory"),
    theme: (formData.get("theme") as string) || undefined,
    status: formData.get("status"),
    description: formData.get("description"),
    isFeatured: formData.get("isFeatured") === "true",
    price: Number(formData.get("price")),
    isPremium: formData.get("isPremium") === "true",
    featureIds: formData.getAll("featureIds") as string[],
    priority: Number(formData.get("priority")),
    discount: {
      discountType: formData.get("discount.discountType") as string,
      value: Number(formData.get("discount.value")),
    },
    thumbnail: formData.get("thumbnail"),
    images: formData.getAll("images"),
    minQuantity: parseOptionalNumber(formData.get("minQuantity")),
    maxQuantity: parseOptionalNumber(formData.get("maxQuantity")),
  };

  const parsed = validateAndFlatten(productSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    await updateProductWorkflow(productId, {
      ...parsed.data,
      currentPreviewUrl: formData.get("currentPreviewUrl") as string,
    });

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);
    revalidatePath(routes.products.detail(parsed.data.category, productId));

    return {
      success: true,
      data: { message: "상품이 성공적으로 수정되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
