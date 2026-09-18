"use client";

import type { ReactNode, RefObject } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/atoms/alert-dialog";
import { Button } from "@/ui/components/atoms/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  confirmVariant?: "default" | "destructive";
  cancelLabel?: string;
  /** 진행 중에는 확인·취소·Esc를 모두 잠근다 — 소비자가 소유하는 상태다. */
  pending: boolean;
  /** 확인 버튼 자체를 잠그는 추가 조건(예: 상품명 확인 입력 미완료). */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  /** 설명과 버튼 사이에 놓이는 추가 확인 UI. */
  children?: ReactNode;
  /**
   * 닫힐 때 포커스를 되돌릴 요소. 다이얼로그를 연 요소(DropdownMenuItem 등)가
   * 열리는 순간 사라지면 Radix의 기본 포커스 복귀 대상이 없어지므로 명시한다.
   */
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * 확인이 필요한 동작 하나를 사용자에게 되묻는다.
 *
 * 열림·진행 상태와 닫는 시점은 전부 소비자가 소유한다 — 액션이 성공했을 때만
 * 닫고, 실패하면 열어둔 채 재시도할 수 있게 하기 위해서다. 그래서 확인 버튼은
 * Radix의 `AlertDialogAction`(누르면 무조건 닫힘) 대신 일반 `Button`을 쓴다.
 */
const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  confirmVariant = "destructive",
  cancelLabel = "취소",
  pending,
  confirmDisabled = false,
  onConfirm,
  children,
  restoreFocusRef,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent
      // 바깥 클릭으로는 진행 여부와 무관하게 닫히지 않는다 — Radix AlertDialog가
      // `onInteractOutside`/`onPointerDownOutside`를 아예 노출하지 않고 항상
      // 막아둔다(타입에서 Omit). 되돌릴 수 없는 동작을 실수로 흘려보내지 않기 위함이다.
      onEscapeKeyDown={(event) => {
        if (pending) {
          event.preventDefault();
        }
      }}
      onCloseAutoFocus={(event) => {
        if (!restoreFocusRef?.current) {
          return;
        }
        event.preventDefault();
        restoreFocusRef.current.focus();
      }}
    >
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      {children}

      <AlertDialogFooter>
        <AlertDialogCancel asChild>
          <Button type="button" variant="outline" disabled={pending}>
            {cancelLabel}
          </Button>
        </AlertDialogCancel>
        <Button
          type="button"
          variant={confirmVariant}
          disabled={pending || confirmDisabled}
          onClick={onConfirm}
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export { ConfirmDialog };
