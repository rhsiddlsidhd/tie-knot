"use client";

import { useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/ui/fetcher";
import { usePremiumFeature } from "@/ui/hooks/usePremiumFeatures";
import { ProductCatalog as ProductCatalogView } from "@/app/(main)/(products)/products/[category]/_components/ProductCatalog";
import type { PublicProductListPage } from "@/core/domain/product";
import type { ProductCategory, SubCategory } from "@/core/domain/product-category";

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
 * 첫 페이지는 Server Component가 이미 렌더한 결과를 fallbackData로 받고, 더보기부터만
 * route handler를 탄다. SWR key에 category/subCategory가 들어 있어 필터(URL)가 바뀌면
 * 누적분이 자동으로 리셋된다(OrderList.tsx와 동일 패턴). 더보기는 버튼이 아니라 목록
 * 하단 sentinel의 IntersectionObserver로 트리거한다(LiveGuestbookSection.tsx 패턴).
 */
export function ProductCatalog({
  firstPage,
  category,
  availableSubCategories,
  initialSubCategory,
}: ProductCatalogProps) {
  const subCategory =
    initialSubCategory === "all" ? undefined : initialSubCategory;

  const { data, size, setSize, isValidating } =
    useSWRInfinite<PublicProductListPage>(
      (pageIndex, previousPage: PublicProductListPage | null) => {
        if (pageIndex === 0) return buildKey({ category, subCategory });
        if (!previousPage?.nextCursor) return null;
        return buildKey({ category, subCategory, cursor: previousPage.nextCursor });
      },
      fetcher,
      {
        fallbackData: [firstPage],
        revalidateFirstPage: false,
        // 첫 페이지는 방금 Server Component가 조회해 넘겨준 값이다 — 마운트 시
        // 같은 쿼리를 한 번 더 돌리지 않는다.
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
}
