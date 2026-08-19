"use server";

import { updateTag } from "next/cache";
import type { APIResponse } from "@/core/domain";
import { actionError } from "@/boundary";
import { invitationCacheTag, setInvitationStatusForCurrentUser } from "@/services";

export const setInvitationStatus = async (
  orderId: string,
  status: "draft" | "published",
): Promise<APIResponse<{ publicKey: string; status: "draft" | "published" }>> => {
  try {
    const result = await setInvitationStatusForCurrentUser(orderId, status);
    updateTag(invitationCacheTag(result.publicKey));
    return { success: true, data: result };
  } catch (error) {
    return actionError(error);
  }
};
