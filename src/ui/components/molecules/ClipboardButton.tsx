"use client";

import { type ComponentProps } from "react";
import { Copy, CheckCircle } from "lucide-react";
import type { buttonVariants } from "@/ui/components/atoms";
import { Button } from "@/ui/components/atoms";
import { cn } from "@/core/utils";
import { type VariantProps } from "class-variance-authority";

/**
 * 클립보드 복사 버튼 UI (Molecule)
 * 복사 상태(isCopied)와 복사 실행 함수(onCopy)를 외부로부터 주입받는 순수 컴포넌트입니다.
 */
export type ClipboardButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    isCopied: boolean;
    onCopy: () => void;
  };

export function ClipboardButton({
  isCopied,
  onCopy,
  className,
  ...props
}: ClipboardButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {isCopied ? (
        <CheckCircle className="text-success h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
}
