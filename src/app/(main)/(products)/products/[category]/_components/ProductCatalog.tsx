"use client";

import { initialFilterState } from "@/ui/context/productFilter/reducer";
import { ProductFilterProvider, useProductFilter } from "@/ui/context/productFilter/provider";
import React from "react";
import { ProductGrid } from "@/ui/components/organisms/ProductGrid";
import { ProductFilters } from "./ProductFilters";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";

import type { ProductCategory, SubCategory } from "@/core/domain/product-category";

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
