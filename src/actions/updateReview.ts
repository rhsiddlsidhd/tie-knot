"use server";

import type { APIResponse } from "@/core/domain";
import { updateReviewSchema } from "@/core/schemas";
import { updateReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { validateAndFlatten } from "@/core/utils";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const updateReview = async (
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const ratingRaw = formData.get("rating");
  const contentRaw = formData.get("content");
  const imagesRaw = formData.getAll("images");

  const data = {
    reviewId: formData.get("reviewId") as string,
    rating: ratingRaw ? Number(ratingRaw) : undefined,
    content: contentRaw ? (contentRaw as string) : undefined,
    images: imagesRaw.length > 0 ? (imagesRaw as string[]) : undefined,
  };

  const parsed = validateAndFlatten(updateReviewSchema, data);
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

    revalidatePath(routes.myOrders.root);

    return { success: true, data: { message: "리뷰가 수정되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
