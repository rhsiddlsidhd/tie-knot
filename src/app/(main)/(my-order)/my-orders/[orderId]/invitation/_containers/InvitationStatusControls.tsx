"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setInvitationStatus } from "@/actions/setInvitationStatus";
import { routes } from "@/core/domain/routes";
import { Button } from "@/ui/components/atoms/button";

export function InvitationStatusControls({ orderId, status }: { orderId: string; status?: "draft" | "published" }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isPending, startTransition] = useTransition();
  const nextStatus = currentStatus === "published" ? "draft" : "published";

  if (!currentStatus) {
    return (
      <p className="mb-6 text-sm text-muted-foreground">
        청첩장을 저장하면 미리보기와 발행 기능을 사용할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Button type="button" disabled={isPending} onClick={() => startTransition(async () => {
        const result = await setInvitationStatus(orderId, nextStatus);
        if (result?.success) setCurrentStatus(result.data.status);
      })}>
        {currentStatus === "published" ? "발행 취소" : "발행하기"}
      </Button>
      <Button variant="outline" asChild><Link href={routes.myOrders.invitationPreview(orderId)}>미리보기</Link></Button>
      {currentStatus !== "published" && <p className="text-warning text-sm">이미지나 계좌 정보가 비어 있어도 발행할 수 있습니다. 공개 전 내용을 확인해 주세요.</p>}
    </div>
  );
}
