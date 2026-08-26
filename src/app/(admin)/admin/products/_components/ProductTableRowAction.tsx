"use client";
import { deleteProduct, permanentlyDeleteProduct, restoreProduct } from "@/actions";
import type { ProductTableRowProps } from "./ProductTableRow";
import { Button } from "@/ui/components/atoms";
import { useAdminModalStore } from "@/ui/stores";
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

  const handleDelete = async () => {
    if (!confirm(`"${product.title}" 상품을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProduct(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "삭제에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm(`"${product.title}" 상품을 복구하시겠습니까?`)) {
      return;
    }

    setIsRestoring(true);

    try {
      const result = await restoreProduct(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "복구에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    } catch {
      toast.error("복구 중 오류가 발생했습니다.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePurge = async () => {
    if (
      !confirm(
        `"${product.title}" 상품을 영구 삭제하시겠습니까? 이미지 포함 모든 데이터가 사라지며 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    setIsPurging(true);

    try {
      const result = await permanentlyDeleteProduct(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "영구 삭제에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
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
          onClick={handleRestore}
          disabled={isRestoring || isPurging}
        >
          <RotateCcw className="h-4 w-4" />
          복구
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePurge}
          disabled={isRestoring || isPurging}
        >
          <Trash2 className="h-4 w-4" />
          영구 삭제
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => open("EDIT-PRODUCT", { product })}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { ProductTableRowAction };
