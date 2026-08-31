import { AlertCircle } from "lucide-react";

import type { PayStatus } from "@/core/domain";
import type { BuyerInfo, ShippingInfo } from "@/core/schemas";

import { Spinner } from "@/ui/components/atoms";
import { PaymentPendingOverlay } from "@/app/(main)/(checkout)/payment/_components/PaymentPendingOverlay";
import { TypographySmall, TypographyMuted } from "@/ui/components/atoms";
import { BuyerInfoCard } from "@/app/(main)/(checkout)/payment/_components/BuyerInfoCard";
import { ShippingInfoCard } from "@/app/(main)/(checkout)/payment/_components/ShippingInfoCard";
import { TermsAgreementCard } from "@/app/(main)/(checkout)/payment/_components/TermsAgreementCard";
import { CheckoutSubmitBar } from "@/app/(main)/(checkout)/payment/_components/CheckoutSubmitBar";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface CheckoutFormProps {
  loading: boolean;
  paymentStatus: PayStatus | "IDLE";
  agreed: boolean;
  onAgreedChange: (agreed: boolean) => void;
  errorMessage: string | null;
  errors: Partial<Record<keyof BuyerInfo, string[]>>;
  requiresShipping: boolean;
  shippingErrors: Partial<Record<keyof ShippingInfo, string[]>>;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CheckoutForm({
  loading,
  paymentStatus,
  agreed,
  onAgreedChange,
  errorMessage,
  errors,
  requiresShipping,
  shippingErrors,
  pending,
  onSubmit,
}: CheckoutFormProps) {
  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // 배송 카드는 실물 상품 주문일 때만 트리에 들어간다 — 번호 배지는 그에 맞춰
  // 매번 다시 매긴다(카드를 숨긴다고 결제수단 배지가 "3"으로 남아 건너뛰지 않도록).
  const paymentStep = requiresShipping ? 3 : 2;

  return (
    <div className="relative">
      <PaymentPendingOverlay visible={paymentStatus === "PENDING"} />
      <form onSubmit={onSubmit} className="space-y-6 pb-24">
        <BuyerInfoCard step={1} errors={errors} />
        {requiresShipping && <ShippingInfoCard step={2} errors={shippingErrors} />}
        <TermsAgreementCard agreed={agreed} onAgreedChange={onAgreedChange} />
        <PaymentMethodSelector step={paymentStep} error={errors.payMethod?.[0]} />

        {errorMessage && (
          <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <TypographySmall className="font-medium">오류가 발생했습니다</TypographySmall>
              <TypographyMuted className="text-destructive/80 mt-1">{errorMessage}</TypographyMuted>
            </div>
          </div>
        )}

        <CheckoutSubmitBar
          disabled={!agreed}
          pending={pending}
          paymentStatus={paymentStatus}
        />
      </form>
    </div>
  );
}
