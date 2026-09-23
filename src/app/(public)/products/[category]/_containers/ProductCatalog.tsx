"use client";

import { useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/ui/fetcher";
import { usePremiumFeature } from "@/ui/hooks/usePremiumFeatures";
import { ProductCatalog as ProductCatalogView } from "@/app/(public)/products/[category]/_components/ProductCatalog";
import type { PublicProductListPage } from "@/core/domain/product";
import type {
  ProductCategory,
  SubCategory,
} from "@/core/domain/product-category";

const buildKey = ({
  category,
  subCategory,
  cursor,
}: {
  category: ProductCategory;
  subCategory?: SubCategory;
  cursor?: string;
}) => {
  const params = new URLSearchParams({ category });
  if (subCategory) params.set("subCategory", subCategory);
  if (cursor) params.set("cursor", cursor);
  return `/api/products?${params.toString()}`;
};

interface ProductCatalogProps {
  firstPage: PublicProductListPage;
  category: ProductCategory;
  availableSubCategories: SubCategory[];
  initialSubCategory: SubCategory | "all";
}

/**
 * "목록 페이지네이션"을 따른다. 더보기는 버튼이 아니라 목록 하단 sentinel의
 * IntersectionObserver로 트리거한다(LiveGuestbookSection.tsx 패턴).
 */
const ProductCatalog = ({
  firstPage,
  category,
  availableSubCategories,
  initialSubCategory,
}: ProductCatalogProps) => {
  const subCategory =
    initialSubCategory === "all" ? undefined : initialSubCategory;

  const { data, size, setSize, isValidating } =
    useSWRInfinite<PublicProductListPage>(
      (pageIndex, previousPage: PublicProductListPage | null) => {
        if (pageIndex === 0) return buildKey({ category, subCategory });
        if (!previousPage?.nextCursor) return null;
        return buildKey({
          category,
          subCategory,
          cursor: previousPage.nextCursor,
        });
      },
      fetcher,
      {
        fallbackData: [firstPage],
        revalidateFirstPage: false,
        revalidateOnMount: false,
      },
    );

  const { premiumFeatures } = usePremiumFeature();

  const pages = data ?? [firstPage];
  const products = pages.flatMap((page) => page.items);
  const hasMore = Boolean(pages.at(-1)?.nextCursor);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isValidating) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSize(size + 1);
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isValidating, size, setSize]);

  return (
    <ProductCatalogView
      products={products}
      category={category}
      premiumFeatures={premiumFeatures}
      availableSubCategories={availableSubCategories}
      subCategory={initialSubCategory}
      hasMore={hasMore}
      isLoadingMore={isValidating}
      sentinelRef={sentinelRef}
    />
  );
};

export { ProductCatalog };
