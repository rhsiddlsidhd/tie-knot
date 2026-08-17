"use client";

import { useProducts, usePremiumFeature } from "@/client/hooks";
import { ProductCatalog as ProductCatalogView } from "@/client/components/organisms";
import type { Product } from "@/server/services";
import type { ProductCategory, SubCategory } from "@/core/domain";

export function ProductCatalog({
  products,
  category,
  initialSubCategory,
}: {
  products: Product[];
  category: ProductCategory;
  initialSubCategory: SubCategory | "all";
}) {
  const data = useProducts(category, products);
  const { premiumFeatures } = usePremiumFeature();

  return (
    <ProductCatalogView
      products={data}
      category={category}
      premiumFeatures={premiumFeatures}
      initialSubCategory={initialSubCategory}
    />
  );
}
