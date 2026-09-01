"use server";

import type { APIResponse } from "@/core/domain";
import { redirect } from "next/navigation";

import { getAuth, createOrderForCurrentUserService } from "@/services";
import { actionError } from "@/boundary";

import { categoryRequiresShipping, validateAndFlatten } from "@/core/utils";
import { createOrderSchema } from "@/core/schemas";
import type { PayMethod, ProductCategory } from "@/core/domain";
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

  const category = formData.get("productCategory") as ProductCategory;

  // 모바일초대장 주문은 ShippingInfoCard 자체가 폼에 없어 이 필드들이 애초에 안
  // 실려있다 — source of truth인 category로 판단하고, 실물 카테고리인데 값이
  // 비었으면 아래 zod 검증(shipping.optional())을 통과 못 시켜 걸러지게 둔다.
  const data = {
    buyerName: formData.get("buyerName") as string,
    buyerEmail: formData.get("buyerEmail") as string,
    buyerPhone: formData.get("buyerPhone") as string,
    payMethod: formData.get("payMethod") as PayMethod,
    product: {
      productId: formData.get("productId") as string,
      title: formData.get("productTitle") as string,
      thumbnail: formData.get("productThumbnail") as string,
      category,
      pricing: {
        originalPrice: Number(formData.get("originalPrice")),
        discountedPrice: Number(formData.get("discountedPrice")),
      },
      quantity: Number(formData.get("productQuantity")),
      selectedFeatures: JSON.parse(selectedOptionsRaw) ?? [],
    },
    shipping: categoryRequiresShipping(category)
      ? {
          receiver: formData.get("shippingReceiver") as string,
          phone: formData.get("shippingPhone") as string,
          address: formData.get("ship_address") as string,
          addressDetail: formData.get("ship_address_detail") as string,
        }
      : undefined,
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
