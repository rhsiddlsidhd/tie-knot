"use server";

import type { ApiResponse } from "@/core/domain/error";
import { deleteReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const deleteReview = async (
  reviewId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await deleteReviewForCurrentUserService(reviewId);

    revalidatePath(ROUTES.myOrders.root);

    return { success: true, data: { message: "리뷰가 삭제되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};

export { deleteReview };
