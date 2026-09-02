"use server";

import { revalidatePath } from "next/cache";
import type { APIResponse } from "@/core/domain/error";
import { routes } from "@/core/domain/routes";
import { actionError } from "@/boundary";
import { cancelPendingOrderForCurrentUser } from "@/services/order";

export const cancelOrder = async (
  orderId: string,
): Promise<APIResponse<{ orderId: string }>> => {
  try {
    await cancelPendingOrderForCurrentUser(orderId);
    revalidatePath(routes.myOrders.root);
    return { success: true, data: { orderId } };
  } catch (error) {
    return actionError(error);
  }
};
