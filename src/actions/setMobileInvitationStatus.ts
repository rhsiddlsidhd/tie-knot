"use server";

import { updateTag } from "next/cache";
import type { ApiResponse } from "@/core/domain/error";
import { actionError } from "@/boundary";
import {
  mobileInvitationCacheTag,
  setMobileInvitationStatusForCurrentUser,
} from "@/services/mobile-invitation";

const setMobileInvitationStatus = async (
  orderId: string,
  status: "draft" | "published",
): Promise<
  ApiResponse<{ publicKey: string; status: "draft" | "published" }>
> => {
  try {
    const result = await setMobileInvitationStatusForCurrentUser(
      orderId,
      status,
    );
    updateTag(mobileInvitationCacheTag(result.publicKey));
    return { success: true, data: result };
  } catch (error) {
    return actionError(error);
  }
};

export { setMobileInvitationStatus };
