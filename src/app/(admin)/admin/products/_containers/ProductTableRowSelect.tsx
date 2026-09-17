"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { updateProductStatus } from "@/actions/updateProductStatus";
import { toast } from "sonner";
import { BaseSelect } from "@/ui/components/molecules/BaseSelect";
import type { Product } from "@/core/domain/product";
import { EDITABLE_PRODUCT_STATUS_OPTIONS } from "@/core/domain/product";
const ProductTableRowSelect = ({ product }: { product: Product }) => {
  const router = useRouter();
  const [status, setStatus] = useState<string>(product.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const handleStatusChange = async (newStatus: string) => {
    const statusOption = EDITABLE_PRODUCT_STATUS_OPTIONS.find(
      ({ value }) => value === newStatus,
    );
    if (!statusOption) return;

    setIsUpdatingStatus(true);
    setStatus(statusOption.value);

    try {
      const result = await updateProductStatus(product._id, statusOption.value);

      if (result.success === false) {
        toast.error(result.error.message || "상태 변경에 실패했습니다.");
        setStatus(product.status);
        return;
      }

      router.refresh();
    } catch {
      toast.error("상태 변경 중 오류가 발생했습니다.");
      setStatus(product.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  return (
    <BaseSelect
      value={status}
      disabled={isUpdatingStatus}
      options={[...EDITABLE_PRODUCT_STATUS_OPTIONS]}
      onValueChange={(value) => {
        handleStatusChange(value);
      }}
      className={"w-27.5"}
    />
  );
};

export { ProductTableRowSelect };
