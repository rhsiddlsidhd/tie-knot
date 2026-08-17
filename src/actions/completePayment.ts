"use server";

import { revalidatePath } from "next/cache";
import type { APIResponse} from "@/core/domain";
import { completePaymentService } from "@/services";
import type { PayStatus } from "@/core/domain";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";

export const completePayment = async (
  paymentId: string,
): Promise<APIResponse<{ status: PayStatus }>> => {
  try {
    const status = await completePaymentService(paymentId);

    revalidatePath(routes.myOrders.root);

    return { success: true, data: { status } };
  } catch (e) {
    return actionError(e);
  }
};
