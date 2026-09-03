"use server";

import { updateTag } from "next/cache";
import type { APIResponse } from "@/core/domain/error";
import { actionError } from "@/boundary";
import { mobileInvitationCacheTag, setMobileInvitationStatusForCurrentUser } from "@/services/mobile-invitation";

export const setMobileInvitationStatus = async (
  orderId: string,
  status: "draft" | "published",
): Promise<APIResponse<{ publicKey: string; status: "draft" | "published" }>> => {
  try {
    const result = await setMobileInvitationStatusForCurrentUser(orderId, status);
    updateTag(mobileInvitationCacheTag(result.publicKey));
    return { success: true, data: result };
  } catch (error) {
    return actionError(error);
  }
};
