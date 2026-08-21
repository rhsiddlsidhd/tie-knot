"use client";

import { ProductCard } from "@/ui/components/organisms";

import { useVisibleProducts } from "@/ui/hooks";
import { Button } from "@/ui/components/atoms";
import type {
  ProductFilterAction,
  ProductFilterState,
} from "@/ui/stores/context/productFilter";
import type { Product } from "@/core/domain";
import { TypographyMuted, TypographyP } from "../atoms/typography";
import { PackageOpen, SearchX } from "lucide-react";
import type { Dispatch } from "react";

export function ProductGrid({
  data,
  state,
  dispatch,
}: {
  data: Product[];
  state: ProductFilterState;
  dispatch: Dispatch<ProductFilterAction>;
}) {
  const { visibleProducts } = useVisibleProducts({
    state,
    data,
  });

  if (visibleProducts.length !== 0) {
    return (
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {visibleProducts.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </section>
    );
  }

  // 카테고리 자체에 상품이 없는 것과, 필터 조건 때문에 결과가 0개인 것은 다른 상태다 —
  // 후자는 필터를 초기화하면 해결되므로 별도 안내+초기화 버튼을 보여준다.
  const isFilteredEmpty = data.length !== 0;

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
      <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        {isFilteredEmpty ? (
          <SearchX className="text-muted-foreground h-10 w-10 opacity-40" />
        ) : (
          <PackageOpen className="text-muted-foreground h-10 w-10 opacity-40" />
        )}
      </div>
      {isFilteredEmpty ? (
        <>
          <TypographyP className="text-foreground mb-2 text-xl font-semibold tracking-tight">
            조건에 맞는 상품이 없어요
          </TypographyP>
          <TypographyMuted className="mb-4 max-w-[280px] text-base leading-relaxed">
            다른 카테고리나 정렬 조건으로 <br />
            다시 검색해보세요.
          </TypographyMuted>
          <Button variant="outline" onClick={() => dispatch({ type: "RESET_ALL" })}>
            필터 초기화
          </Button>
        </>
      ) : (
        <>
          <TypographyP className="text-foreground mb-2 text-xl font-semibold tracking-tight">
            상품을 준비 중에 있습니다
          </TypographyP>
          <TypographyMuted className="max-w-[280px] text-base leading-relaxed">
            보다 완성도 높은 디자인을 위해 <br />
            열심히 제작하고 있어요. 조금만 기다려주세요!
          </TypographyMuted>
        </>
      )}
    </div>
  );
}
