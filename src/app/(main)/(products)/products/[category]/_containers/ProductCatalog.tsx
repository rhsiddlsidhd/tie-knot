"use client";

import { useProducts } from "@/ui/hooks/useProducts";
import { usePremiumFeature } from "@/ui/hooks/usePremiumFeatures";
import { ProductCatalog as ProductCatalogView } from "@/app/(main)/(products)/products/[category]/_components/ProductCatalog";
import type { Product } from "@/core/domain/product";
import type { ProductCategory, SubCategory } from "@/core/domain/product-category";

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
