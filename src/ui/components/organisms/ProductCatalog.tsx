"use client";

import {
  initialFilterState,
  ProductFilterProvider,
  useProductFilter,
} from "@/ui/context/productFilter";
import React from "react";
import { ProductFilters, ProductGrid } from "@/ui/components/organisms";
import type { Product, PremiumFeature } from "@/core/domain";

import type { ProductCategory, SubCategory } from "@/core/domain";

interface ProductCatalogProps {
  products: Product[];
  category: ProductCategory;
  premiumFeatures: PremiumFeature[];
  initialSubCategory: SubCategory | "all";
}

function ProductCatalogBody({
  products,
  category,
  premiumFeatures,
}: Omit<ProductCatalogProps, "initialSubCategory">) {
  const [state, dispatch] = useProductFilter();

  return (
    <>
      {/* Filters */}
      <ProductFilters
        data={products}
        category={category}
        premiumFeatures={premiumFeatures}
        state={state}
        dispatch={dispatch}
      />
      {/* Product Grid */}
      <ProductGrid data={products} state={state} dispatch={dispatch} />
    </>
  );
}

const ProductCatalog = ({
  products,
  category,
  premiumFeatures,
  initialSubCategory,
}: ProductCatalogProps) => {
  return (
    <ProductFilterProvider
      initialValue={{ ...initialFilterState, subCategory: initialSubCategory }}
    >
      <ProductCatalogBody
        products={products}
        category={category}
        premiumFeatures={premiumFeatures}
      />
    </ProductFilterProvider>
  );
};

export { ProductCatalog };
