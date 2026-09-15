"use client";

import { useState } from "react";
import { Edit, Link2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deletePremiumFeature } from "@/actions/deletePremiumFeature";
import { Button } from "@/ui/components/atoms/button";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { ROUTES } from "@/core/domain/routes";
import { useAdminModalStore } from "@/ui/stores/use-app-store";

const PremiumFeatureRowAction = ({
  premiumFeature,
}: {
  premiumFeature: PremiumFeature;
}) => {
  const openModal = useAdminModalStore((state) => state.openModal);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // 실패하면 다이얼로그를 닫지 않는다 — 참조 상품 때문에 막힌 경우 어떤 상품이
  // 막는지 toast로 알리고 그 자리에서 다시 시도할 수 있게 한다.
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deletePremiumFeature(premiumFeature._id);

      if (result.success === false) {
        toast.error(result.error.message || "삭제에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        aria-label="기능 수정"
        onClick={() => openModal("EDIT-PREMIUMFEATURE", { premiumFeature })}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" asChild>
        <Link href={ROUTES.admin.premiumFeatures.products(premiumFeature._id)}>
          <Link2 className="h-4 w-4" />
          연결 상품
        </Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        aria-label="기능 삭제"
        onClick={() => setIsDeleteOpen(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="프리미엄 기능 삭제"
        description={`"${premiumFeature.label}" 기능을 삭제합니다. 삭제하면 복구할 수 없습니다. 이미 판매된 주문에는 영향을 주지 않습니다.`}
        confirmLabel="삭제"
        pendingLabel="삭제 중..."
        pending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export { PremiumFeatureRowAction };
