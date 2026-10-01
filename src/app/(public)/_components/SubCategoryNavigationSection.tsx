"use client";

import { TypographyH2 } from "@/ui/components/atoms/typography";
import { CarouselList } from "@/ui/components/molecules/CarouselList";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { buildAllSubCategoryPairs } from "@/core/utils/navigation";
import { SubCategoryNavigationItem } from "./SubCategoryNavigationItem";

interface SubCategoryNavigationSectionProps {
  // null = 조회 실패. 섹션을 비우는 대신 정적 전체 목록으로 폴백한다(헤더 nav와 동일 방침).
  availableSubCategories: AvailableSubCategory[] | null;
}

const SubCategoryNavigationSection = ({
  availableSubCategories,
}: SubCategoryNavigationSectionProps) => {
  const pairs = availableSubCategories ?? buildAllSubCategoryPairs();

  // 공개 상품이 하나도 없으면 링크가 전부 죽은 상태라 섹션 자체를 숨긴다.
  if (pairs.length === 0) return null;

  return (
    <section className="container mx-auto py-4">
      <TypographyH2
        id="sub-category-nav-heading"
        className="mb-4 border-none text-xl font-bold"
      >
        카테고리 둘러보기
      </TypographyH2>
      <CarouselList
        id="sub-category-nav-heading"
        opts={{ align: "start", loop: false, dragFree: true }}
      >
        {pairs.map(({ category, subCategory }) => (
          <SubCategoryNavigationItem
            key={`${category}-${subCategory}`}
            category={category}
            subCategory={subCategory}
          />
        ))}
      </CarouselList>
    </section>
  );
};

export { SubCategoryNavigationSection };
