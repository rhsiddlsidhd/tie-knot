"use server";

import type { APIResponse } from "@/core/domain";
import { deleteReviewByAdminService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const deleteReviewByAdmin = async (
  reviewId: string,
): Promise<APIResponse<{ message: string }>> => {
  try {
    await deleteReviewByAdminService(reviewId);

    revalidatePath(routes.admin.reviews);

    return { success: true, data: { message: "리뷰가 삭제되었습니다." } };
  } catch (e) {
    return actionError(e);
  }
};
