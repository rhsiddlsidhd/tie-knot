"use client";

import type { RefObject } from "react";
import { initialFilterState } from "@/ui/context/productFilter/reducer";
import { ProductFilterProvider, useProductFilter } from "@/ui/context/productFilter/provider";
import { ProductGrid } from "@/ui/components/organisms/ProductGrid";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { ProductFilters } from "./ProductFilters";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";

import type { ProductCategory, SubCategory } from "@/core/domain/product-category";

interface ProductCatalogProps {
  products: Product[];
  category: ProductCategory;
  premiumFeatures: PremiumFeature[];
  availableSubCategories: SubCategory[];
  subCategory: SubCategory | "all";
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

function ProductCatalogBody({
  products,
  category,
  premiumFeatures,
  availableSubCategories,
  subCategory,
  hasMore,
  isLoadingMore,
  sentinelRef,
}: ProductCatalogProps) {
  const [state, dispatch] = useProductFilter();

  return (
    <>
      {/* Filters */}
      <ProductFilters
        data={products}
        category={category}
        subCategory={subCategory}
        availableSubCategories={availableSubCategories}
        premiumFeatures={premiumFeatures}
        state={state}
        dispatch={dispatch}
      />
      {/* Product Grid */}
      <ProductGrid data={products} state={state} dispatch={dispatch} />

      {/* 더보기 자동 로드 트리거 — 목록 하단에 닿으면 IntersectionObserver가 다음
          페이지를 요청한다(LiveGuestbookSection.tsx와 동일 패턴, 버튼 없음). */}
      {hasMore && (
        <div
          ref={sentinelRef}
          data-testid="load-more-sentinel"
          className="h-4"
          aria-hidden="true"
        />
      )}
      {isLoadingMore && (
        <TypographyMuted className="py-4 text-center">
          불러오는 중...
        </TypographyMuted>
      )}
    </>
  );
}

const ProductCatalog = ({
  products,
  category,
  premiumFeatures,
  availableSubCategories,
  subCategory,
  hasMore,
  isLoadingMore,
  sentinelRef,
}: ProductCatalogProps) => {
  return (
    <ProductFilterProvider initialValue={initialFilterState}>
      <ProductCatalogBody
        products={products}
        category={category}
        premiumFeatures={premiumFeatures}
        availableSubCategories={availableSubCategories}
        subCategory={subCategory}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        sentinelRef={sentinelRef}
      />
    </ProductFilterProvider>
  );
};

export { ProductCatalog };
