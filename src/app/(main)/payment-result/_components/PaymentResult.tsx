"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completePayment } from "@/actions/completePayment";
import { routes } from "@/core/domain/routes";
import { useOrderStore } from "@/ui/stores/use-app-store";
import { PaymentResultTemplate } from "./PaymentResultTemplate";

interface PaymentResultProps {
  paymentId?: string;
}

export function PaymentResult({ paymentId }: PaymentResultProps) {
  const router = useRouter();
  const clearOrder = useOrderStore((state) => state.clearOrder);
  const setPaymentStatus = useOrderStore((state) => state.setPaymentStatus);
  const started = useRef(false);
  const [, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(
    paymentId ? null : "결제 정보가 올바르지 않습니다.",
  );

  useEffect(() => {
    if (!paymentId || started.current) return;
    started.current = true;

    startTransition(async () => {
      try {
        const result = await completePayment(paymentId);

        if (result.success === false) {
          setErrorMessage(result.error.message);
          return;
        }

        if (result.data.status !== "PAID") {
          setErrorMessage("결제 검증에 실패했습니다. 고객센터에 문의해주세요.");
          return;
        }

        setPaymentStatus("PAID");
        clearOrder();
        router.replace(
          `${routes.payment.success}?orderId=${encodeURIComponent(paymentId)}`,
        );
      } catch (error) {
        console.error("Payment completion error:", error);
        setErrorMessage("결제 처리 중 오류가 발생했습니다.");
      }
    });
  }, [clearOrder, paymentId, router, setPaymentStatus]);

  return <PaymentResultTemplate errorMessage={errorMessage} />;
}
