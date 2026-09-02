"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/components/atoms";
import { CreditCard } from "lucide-react";
import { useOrderStore } from "@/ui/stores";
import type { OrderJSON } from "@/core/domain/order";
import type { CheckoutItem } from "@/core/domain/checkout";
import { routes } from "@/core/domain/routes";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { completePayment } from "@/actions/completePayment";

const PaymentButton = ({ order }: { order: OrderJSON }) => {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);
  const setResumePayment = useOrderStore((state) => state.setResumePayment);
  const [isChecking, setIsChecking] = useState(false);

  const handleClick = async () => {
    setIsChecking(true);
    // 재시도 전 PG 실제 상태를 먼저 확인한다(GH #78) — 이미 PAID인데 DB 반영만
    // 실패해 PENDING으로 남은 주문에 이 버튼을 누르면 새 merchantUid로 새 주문이
    // 생성돼 실제 결제가 한 번 더 일어난다. completePayment는 PG 조회 + 동기화를
    // 수행하고 PAID였다면 이 호출로 이미 CONFIRMED 반영까지 끝낸다.
    const result = await completePayment(order.merchantUid);
    setIsChecking(false);

    if (result.success && result.data.status === "PAID") {
      router.push(routes.myOrders.detail(order._id));
      return;
    }

    // 그 외(PAID 아님, 또는 PortOne에 한 번도 제출 안 된 merchantUid라 조회 자체가
    // 실패한 경우 포함) → 진짜 미결제로 보고 같은 merchantUid로 재시도한다. 이
    // 판정이 틀려도 PortOne 자체가 이미 PAID인 paymentId 재사용을 막아주므로 이
    // 체크가 유일한 방어선은 아니다.
    const optionsTotalPrice = order.product.selectedFeatures.reduce(
      (sum, f) => sum + f.price,
      0,
    );

    const checkoutItem: CheckoutItem = {
      productId: order.product.productId.toString(),
      // 재결제 흐름은 이 값을 실제로 쓰지 않는다(resumePayment 분기가 ShippingInfoCard
      // 렌더 전에 걸린다) — 카테고리 정보 없는 레거시 주문 대비 안전한 기본값만 채운다.
      category: order.product.category ?? MOBILE_INVITATION_CATEGORY,
      title: order.product.title,
      thumbnail: order.product.thumbnail,
      originalPrice: order.product.pricing.originalPrice,
      discountedPrice: order.product.pricing.discountedPrice,
      discountAmount:
        order.product.pricing.originalPrice - order.product.pricing.discountedPrice,
      optionsTotalPrice,
      finalPrice: order.finalPrice,
      quantity: order.product.quantity,
      selectedFeatures: order.product.selectedFeatures.map((f) => ({
        featureId: f.featureId.toString(),
        code: f.code,
        label: f.label,
        price: f.price,
      })),
    };

    setOrder(checkoutItem);
    setResumePayment({
      merchantUid: order.merchantUid,
      finalPrice: order.finalPrice,
      payMethod: order.payMethod,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerPhone: order.buyerPhone,
      title: order.product.title,
      userId: order.userId,
      productId: order.product.productId.toString(),
      // CreateOrderResult가 요구하는 필드지만 triggerPayment는 읽지 않는다
      // (src/ui/hooks/usePortOnePayment.ts) — 타입만 맞추는 고정 문자열.
      message: "재결제를 진행합니다.",
    });
    router.push(routes.payment.root);
  };

  return (
    <Button size="lg" variant="default" onClick={handleClick} disabled={isChecking}>
      <CreditCard className="mr-1 h-4 w-4" />
      결제하기
    </Button>
  );
};

export { PaymentButton };
