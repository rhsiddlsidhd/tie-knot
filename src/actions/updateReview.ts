"use server";

import type { ApiResponse } from "@/core/domain/error";
import { UpdateReviewSchema } from "@/core/schemas/request/review.schema";
import { updateReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const updateReview = async (
  _prev: unknown,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  const ratingRaw = formData.get("rating");
  const contentRaw = formData.get("content");
  const imagesRaw = formData.getAll("images");

  const data = {
    reviewId: formData.get("reviewId") as string,
    rating: ratingRaw ? Number(ratingRaw) : undefined,
    content: contentRaw ? (contentRaw as string) : undefined,
    images: imagesRaw.length > 0 ? (imagesRaw as string[]) : undefined,
  };

  const parsed = validateAndFlatten(UpdateReviewSchema, data);
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
    await updateReviewForCurrentUserService(parsed.data);

    revalidatePath(ROUTES.myOrders.root);

    return { success: true, data: { message: "리뷰가 수정되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};

export { updateReview };
