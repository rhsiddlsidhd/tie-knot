"use server";

import type { ApiResponse } from "@/core/domain/error";
import { deleteReviewByAdminService } from "@/services/review";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const deleteReviewByAdmin = async (
  reviewId: string,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    await deleteReviewByAdminService(reviewId);

    revalidatePath(ROUTES.admin.reviews);

    return { success: true, data: { message: "리뷰가 삭제되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};

export { deleteReviewByAdmin };
