"use server";

import type { APIResponse } from "@/core/domain";
import { deleteReviewForCurrentUserService } from "@/services/review";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const deleteReview = async (
  reviewId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await deleteReviewForCurrentUserService(reviewId);

    revalidatePath(routes.myOrders.root);

    return { success: true, data: { message: "리뷰가 삭제되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
