"use client";
import { deleteProduct } from "@/actions/deleteProduct";
import { permanentlyDeleteProduct } from "@/actions/permanentlyDeleteProduct";
import { restoreProduct } from "@/actions/restoreProduct";
import type { ProductTableRowProps } from "../_components/ProductTableRow";
import { Button } from "@/ui/components/atoms/button";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import { ProductPermanentDeleteDialog } from "../_components/ProductPermanentDeleteDialog";
import { useAdminModalStore } from "@/ui/stores/use-app-store";
import { Edit, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const ProductTableRowAction = ({ product, view = "active" }: ProductTableRowProps) => {
  const open = useAdminModalStore((state) => state.openModal);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);

  // 실패하면 다이얼로그를 닫지 않는다 — 사용자가 오류 toast를 보고 그대로 재시도한다.
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteProduct(product._id);

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

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const result = await restoreProduct(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "복구에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      setIsRestoreOpen(false);
      router.refresh();
    } catch {
      toast.error("복구 중 오류가 발생했습니다.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);

    try {
      const result = await permanentlyDeleteProduct(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "영구 삭제에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      setIsPurgeOpen(false);
      router.refresh();
    } catch {
      toast.error("영구 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsPurging(false);
    }
  };

  if (view === "trash") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsRestoreOpen(true)}
          disabled={isRestoring || isPurging}
        >
          <RotateCcw className="h-4 w-4" />
          복구
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPurgeOpen(true)}
          disabled={isRestoring || isPurging}
        >
          <Trash2 className="h-4 w-4" />
          영구 삭제
        </Button>

        <ConfirmDialog
          open={isRestoreOpen}
          onOpenChange={setIsRestoreOpen}
          title="상품 복구"
          description={`"${product.title}" 상품을 복구합니다. 복구하면 판매 목록에 다시 표시되며, 언제든 다시 삭제할 수 있습니다.`}
          confirmLabel="복구"
          pendingLabel="복구 중..."
          confirmVariant="default"
          pending={isRestoring}
          onConfirm={handleRestore}
        />
        <ProductPermanentDeleteDialog
          open={isPurgeOpen}
          onOpenChange={setIsPurgeOpen}
          productTitle={product.title}
          pending={isPurging}
          onConfirm={handlePurge}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        aria-label="상품 수정"
        onClick={() => open("EDIT-PRODUCT", { product })}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        aria-label="상품 삭제"
        onClick={() => setIsDeleteOpen(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="상품 삭제"
        description={`"${product.title}" 상품을 삭제합니다. 삭제한 상품은 휴지통에서 복구할 수 있습니다.`}
        confirmLabel="삭제"
        pendingLabel="삭제 중..."
        pending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export { ProductTableRowAction };
