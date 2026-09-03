"use client";

import { useId, useState } from "react";
import { Input } from "@/ui/components/atoms/input";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";

interface ProductPermanentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
  pending: boolean;
  onConfirm: () => void;
}

/**
 * 영구 삭제는 되돌릴 수 없어 확인 한 번으로는 부족하다 — 상품명을 그대로 입력해야
 * 실행 버튼이 열린다. 대소문자나 앞뒤 공백을 보정하지 않는 완전 일치다.
 *
 * 실패하면 입력값을 남겨 그대로 재시도할 수 있고, 다이얼로그가 닫힐 때 비운다.
 */
const ProductPermanentDeleteDialog = ({
  open,
  onOpenChange,
  productTitle,
  pending,
  onConfirm,
}: ProductPermanentDeleteDialogProps) => {
  const inputId = useId();
  const [confirmationText, setConfirmationText] = useState("");
  // 열림 여부가 바뀌는 렌더에서 입력값을 비운다 — 취소든 성공이든 닫히는 경로가
  // 여럿이라 특정 핸들러에 초기화를 걸 수 없다. effect로 하면 닫힌 값이 한 번
  // 그려진 뒤에야 비워져 cascading render가 된다(React "prop 변화에 state 맞추기").
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    setConfirmationText("");
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="상품 영구 삭제"
      description={`"${productTitle}" 상품을 영구 삭제합니다. 이미지를 포함한 모든 데이터가 사라지며 복구할 수 없습니다.`}
      confirmLabel="영구 삭제"
      pendingLabel="영구 삭제 중..."
      pending={pending}
      confirmDisabled={confirmationText !== productTitle}
      onConfirm={onConfirm}
    >
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          확인을 위해 상품명 &quot;{productTitle}&quot;을 입력하세요
        </label>
        <Input
          id={inputId}
          value={confirmationText}
          disabled={pending}
          autoComplete="off"
          onChange={(event) => setConfirmationText(event.target.value)}
        />
      </div>
    </ConfirmDialog>
  );
};

export { ProductPermanentDeleteDialog };
