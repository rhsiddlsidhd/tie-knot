"use server";

import type { APIResponse } from "@/core/domain";
import { createReviewSchema } from "@/core/schemas";
import { createReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const createReview = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    orderId: formData.get("orderId") as string,
    rating: Number(formData.get("rating")),
    content: formData.get("content") as string,
    images: formData.getAll("images") as string[],
  };

  const parsed = validateAndFlatten(createReviewSchema, data);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    await createReviewForCurrentUserService(parsed.data);

    revalidatePath(routes.myOrders.root);

    return { success: true, data: { message: "리뷰가 등록되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
