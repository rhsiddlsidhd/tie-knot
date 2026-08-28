"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrder, type CreateOrderResult } from "@/actions";
import type { APIResponse } from "@/core/domain";
import { useOrderStore } from "@/ui/stores";
import { usePortOnePayment } from "@/ui/hooks";
import { useCheckoutData } from "@/ui/hooks";
import { useCheckoutForm } from "@/ui/hooks";
import { CheckoutForm as PureCheckoutForm } from "@/ui/components/organisms";
import { routes } from "@/core/domain";
import { RetryPaymentCard } from "./RetryPaymentCard";
export function CheckoutForm() {
  const router = useRouter();
  const clearOrder = useOrderStore((state) => state.clearOrder);

  const [state, action, pending] = useActionState<APIResponse<CreateOrderResult>, FormData>(
    createOrder,
    null,
  );
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePaymentSuccess = useCallback(
    (merchantUid: string) => {
      clearOrder();
      toast.success("결제가 완료되었습니다!");
      router.push(`${routes.payment.success}?orderId=${merchantUid}`);
    },
    [clearOrder, router],
  );

  const { paymentStatus, triggerPayment } = usePortOnePayment({
    onSuccess: handlePaymentSuccess,
    onError: setErrorMessage,
  });

  // 결제 진행 중/실패/완료 상태는 useCheckoutData가 order.store의 paymentStatus를
  // 직접 참조해 "주문 없음" 오탐 리다이렉트를 알아서 가드한다(OrderSummary도 동일).
  const { data: order, loading } = useCheckoutData();

  const { errors, shippingErrors, requiresShipping, handleSubmit } = useCheckoutForm({
    order,
    action,
    router,
  });

  const [prevActionState, setPrevActionState] = useState(state);
  if (state !== prevActionState) {
    setPrevActionState(state);
    setErrorMessage(state && state.success === false ? state.error.message : null);
  }

  useEffect(() => {
    if (state && state.success !== false) {
      triggerPayment(state.data);
    }
  }, [state, triggerPayment]);

  // 결제 실패 후 재시도 시 기존 주문(merchantUid)으로 재결제 — DB 주문 중복 생성 방지
  const handleFormSubmit = (e: React.FormEvent) => {
    if (state?.success) {
      e.preventDefault();
      setErrorMessage(null);
      triggerPayment(state.data);
      return;
    }
    handleSubmit(e);
  };

  // PaymentButton이 PG 조회 결과 진짜 미결제로 판정한 기존 주문 — 새 주문(createOrder)
  // 대신 같은 merchantUid로 재결제한다(GH #78). 훅 전부(위)를 거친 뒤 마지막에
  // 분기해야 훅 호출 순서가 매 렌더 동일하게 유지된다.
  const resumePayment = useOrderStore((s) => s.resumePayment);
  if (resumePayment) {
    return (
      <RetryPaymentCard
        order={resumePayment}
        paymentStatus={paymentStatus}
        errorMessage={errorMessage}
        onConfirm={() => triggerPayment(resumePayment)}
      />
    );
  }

  return (
    <PureCheckoutForm
      loading={loading}
      paymentStatus={paymentStatus}
      agreed={agreed}
      onAgreedChange={setAgreed}
      errorMessage={errorMessage}
      errors={errors}
      requiresShipping={requiresShipping}
      shippingErrors={shippingErrors}
      pending={pending}
      onSubmit={handleFormSubmit}
    />
  );
}
