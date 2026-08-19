"use server";

import type { APIResponse } from "@/core/domain";
import { redirect } from "next/navigation";

import { getAuth, createOrderForCurrentUserService } from "@/services";
import { actionError } from "@/boundary";

import { validateAndFlatten } from "@/core/utils";
import { createOrderSchema } from "@/core/schemas";
import type { PayMethod } from "@/core/domain";
import { routes } from "@/core/domain";
export type CreateOrderResult = {
  merchantUid: string;
  finalPrice: number;
  payMethod: PayMethod;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  title: string;
  userId: string;
  productId: string;
  message: string;
};

export async function createOrder(
  _prev: unknown,
  formData: FormData,
): Promise<APIResponse<CreateOrderResult>> {
  // 로그인 안 된 상태면 로그인 페이지로(리다이렉트는 try/catch 밖에서)
  if (!(await getAuth())) {
    redirect(routes.login);
  }

  // FormData에서 주문 정보 추출
  const selectedOptionsRaw = formData.get("selectedFeatures") as string;

  const data = {
    buyerName: formData.get("buyerName") as string,
    buyerEmail: formData.get("buyerEmail") as string,
    buyerPhone: formData.get("buyerPhone") as string,
    payMethod: formData.get("payMethod") as PayMethod,
    product: {
      productId: formData.get("productId") as string,
      title: formData.get("productTitle") as string,
      thumbnail: formData.get("productThumbnail") as string,
      pricing: {
        originalPrice: Number(formData.get("originalPrice")),
        discountedPrice: Number(formData.get("discountedPrice")),
      },
      quantity: Number(formData.get("productQuantity")),
      selectedFeatures: JSON.parse(selectedOptionsRaw) ?? [],
    },
  };

  // Zod 스키마로 유효성 검증
  const parsed = validateAndFlatten(createOrderSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력값이 올바르지 않습니다.", fieldErrors: parsed.error },
    };
  }

  try {
    const order = await createOrderForCurrentUserService(parsed.data);

    return {
      success: true,
      data: {
        merchantUid: order.merchantUid,
        finalPrice: order.finalPrice,
        payMethod: order.payMethod,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        buyerPhone: order.buyerPhone,
        title: order.product.title,
        userId: order.userId.toString(),
        productId: order.product.productId.toString(),
        message: "주문이 성공적으로 생성되었습니다. 결제를 진행해주세요.",
      },
    };
  } catch (e) {
    return actionError(e);
  }
}
