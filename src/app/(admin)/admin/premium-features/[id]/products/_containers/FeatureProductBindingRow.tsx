"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setProductPremiumFeature } from "@/actions/setProductPremiumFeature";
import { Badge } from "@/ui/components/atoms/badge";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { TableCell, TableRow } from "@/ui/components/atoms/table";
import type { FeatureProductBinding } from "@/core/domain/premium-feature";
import type { ProductStatus } from "@/core/domain/product";

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: "판매중",
  inactive: "비활성",
  soldOut: "품절",
  deleted: "삭제됨",
};

/**
 * 체크가 곧 저장이다 — 목록이 URL로 페이징돼 선택 상태를 클라이언트에 모아둘 수
 * 없으므로 서버가 유일한 진실이다. 실패하면 화면 체크를 원래대로 되돌린다.
 */
const FeatureProductBindingRow = ({
  product,
  featureId,
}: {
  product: FeatureProductBinding;
  featureId: string;
}) => {
  const router = useRouter();
  const [attached, setAttached] = useState(product.attached);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (next: boolean) => {
    setAttached(next);
    setIsPending(true);

    try {
      const result = await setProductPremiumFeature({
        productId: product._id,
        featureId,
        attached: next,
      });

      if (result.success === false) {
        toast.error(result.error.message || "변경에 실패했습니다.");
        setAttached(!next);
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    } catch {
      toast.error("변경 중 오류가 발생했습니다.");
      setAttached(!next);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={attached}
          disabled={isPending}
          aria-label={`${product.title} 연결`}
          onCheckedChange={(checked) => handleToggle(!!checked)}
        />
      </TableCell>
      <TableCell className="font-medium">{product.title}</TableCell>
      <TableCell>{product.price.toLocaleString()}원</TableCell>
      <TableCell>
        <Badge variant={product.status === "active" ? "default" : "secondary"}>
          {STATUS_LABELS[product.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

export { FeatureProductBindingRow };
