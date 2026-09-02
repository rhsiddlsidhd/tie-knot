"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useOrderStore } from "@/ui/stores";
import type { Product } from "@/services/product";
import type { PremiumFeature } from "@/services/premiumFeature";

import type { CheckoutItem } from "@/core/domain";
import { ProductSummary as PureProductSummary } from "../_components/ProductSummary";
import { routes } from "@/core/domain";
export function ProductSummary({
  product,
  options,
}: {
  product: Product;
  options: PremiumFeature[];
}) {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);

  const handlePurchase = useCallback(
    (checkoutData: CheckoutItem) => {
      setOrder(checkoutData);
      router.push(routes.payment.root);
    },
    [setOrder, router],
  );

  return (
    <PureProductSummary
      product={product}
      options={options}
      onPurchase={handlePurchase}
    />
  );
}
