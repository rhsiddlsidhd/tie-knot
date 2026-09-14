"use server";

import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/core/domain/error";
import { ROUTES } from "@/core/domain/routes";
import { actionError } from "@/boundary";
import { cancelPendingOrderForCurrentUser } from "@/services/order";

const cancelOrder = async (
  orderId: string,
): Promise<ApiResponse<{ orderId: string }>> => {
  try {
    await cancelPendingOrderForCurrentUser(orderId);
    revalidatePath(ROUTES.myOrders.root);
    return { success: true, data: { orderId } };
  } catch (error) {
    return actionError(error);
  }
};

export { cancelOrder };
