"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useOrderStore } from "@/client/store";
import type { Product, PremiumFeature } from "@/shared/types";

import type { CheckoutItem } from "@/shared/types";
import { ProductSummary as PureProductSummary } from "@/client/components/organisms";
import { routes } from "@/shared/constants";
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
