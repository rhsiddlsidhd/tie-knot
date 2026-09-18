"use server";

import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/core/domain/error";
import { completePaymentService } from "@/services/payment";
import type { PayStatus } from "@/core/domain/payment";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";

const completePayment = async (
  paymentId: string,
): Promise<ApiResponse<{ status: PayStatus }>> => {
  try {
    const status = await completePaymentService(paymentId);

    revalidatePath(ROUTES.myOrders.root);

    return { success: true, data: { status } };
  } catch (e) {
    return actionError(e);
  }
};

export { completePayment };
