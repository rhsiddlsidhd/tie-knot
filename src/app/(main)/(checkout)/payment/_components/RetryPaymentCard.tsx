"use client";

import { AlertCircle } from "lucide-react";
import type { CreateOrderResult } from "@/actions";
import type { PayStatus } from "@/core/domain";
import { Button } from "@/ui/components/atoms";
import { TypographyLarge, TypographyMuted, TypographySmall } from "@/ui/components/atoms";
import { PaymentPendingOverlay } from "./PaymentPendingOverlay";

interface RetryPaymentCardProps {
  order: CreateOrderResult;
  paymentStatus: PayStatus | "IDLE";
  errorMessage: string | null;
  onConfirm: () => void;
}

// 기존 merchantUid로 재결제를 시도하는 뷰 — buyer info 입력은 최초 주문 생성 시
// 이미 받았으므로 폼을 다시 안 보여준다. 주문 요약(제목/금액/결제수단)은
// (checkout)/layout.tsx가 이미 렌더하는 OrderSummary와 중복돼 확인 문구만 둔다.
// PortOne 팝업(triggerPayment)은 반드시 이 버튼의 onClick에서 직접 호출돼야
// 한다 — 마운트 시 자동 트리거하면 사용자 제스처 없이 팝업이 열려 차단될 수 있다.
export function RetryPaymentCard({
  order,
  paymentStatus,
  errorMessage,
  onConfirm,
}: RetryPaymentCardProps) {
  const isProcessing = paymentStatus === "PENDING";

  return (
    <div className="relative space-y-6 pb-24">
      <PaymentPendingOverlay visible={isProcessing} />
      <div className="space-y-2">
        <TypographyLarge>재결제를 진행합니다</TypographyLarge>
        <TypographyMuted>
          이전 결제가 완료되지 않아 같은 주문으로 다시 결제를 진행합니다.
        </TypographyMuted>
      </div>

      {errorMessage && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <TypographySmall className="font-medium">오류가 발생했습니다</TypographySmall>
            <TypographyMuted className="text-destructive/80 mt-1">{errorMessage}</TypographyMuted>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={isProcessing}
        onClick={onConfirm}
      >
        {isProcessing ? "결제 진행 중..." : `${order.finalPrice.toLocaleString()}원 재결제하기`}
      </Button>
    </div>
  );
}
