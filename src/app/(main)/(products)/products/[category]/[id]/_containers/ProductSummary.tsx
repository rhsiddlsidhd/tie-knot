"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useOrderStore } from "@/ui/stores/use-app-store";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";

import type { CheckoutItem } from "@/core/domain/checkout";
import { ProductSummary as PureProductSummary } from "../_components/ProductSummary";
import { ROUTES } from "@/core/domain/routes";
const ProductSummary = ({
  product,
  options,
}: {
  product: Product;
  options: PremiumFeature[];
}) => {
  const router = useRouter();
  const setOrder = useOrderStore((state) => state.setOrder);

  const handlePurchase = useCallback(
    (checkoutData: CheckoutItem) => {
      setOrder(checkoutData);
      router.push(ROUTES.payment.root);
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
};

export { ProductSummary };
