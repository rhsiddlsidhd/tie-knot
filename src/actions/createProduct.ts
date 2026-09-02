"use server";

import type { APIResponse } from "@/core/domain/error";
import { createProductWorkflow } from "@/services/product";
import { actionError } from "@/boundary";
import { productSchema } from "@/core/schemas/request/product.schema";
import { routes } from "@/core/domain/routes";

import { revalidatePath } from "next/cache";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

// 빈 문자열/null이면 undefined를 넘겨 zod .default()가 동작하게 한다 —
// Number(null)===0 / Number("")===0으로 파싱되면 min(1) 검증에 걸린다.
const parseOptionalNumber = (raw: FormDataEntryValue | null): number | undefined =>
  raw ? Number(raw) : undefined;

export const createProduct = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    subCategory: formData.get("subCategory") as string,
    theme: (formData.get("theme") as string) || undefined,
    price: Number(formData.get("price")),
    isPremium: formData.get("isPremium") === "true",
    featureIds: formData.getAll("featureIds") as string[],
    isFeatured: formData.get("isFeatured") === "true",
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
    await createProductWorkflow({
      ...parsed.data,
      previewUrl: (formData.get("previewUrl") as string) || undefined,
    });

    revalidatePath(routes.admin.products.root);
    revalidatePath(routes.products.root);

    return {
      success: true,
      data: { message: "상품이 성공적으로 등록되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
