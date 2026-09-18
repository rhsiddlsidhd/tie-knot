"use server";

import type { ApiResponse } from "@/core/domain/error";
import { CreateReviewSchema } from "@/core/schemas/request/review.schema";
import { createReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const createReview = async (
  _prev: unknown,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  const data = {
    orderId: formData.get("orderId") as string,
    rating: Number(formData.get("rating")),
    content: formData.get("content") as string,
    images: formData.getAll("images") as string[],
  };

  const parsed = validateAndFlatten(CreateReviewSchema, data);
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

    revalidatePath(ROUTES.myOrders.root);

    return { success: true, data: { message: "리뷰가 등록되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};

export { createReview };
