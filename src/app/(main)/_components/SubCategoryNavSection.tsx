"use client";

import { TypographyH2 } from "@/ui/components/atoms/typography";
import { CarouselList } from "@/ui/components/molecules/CarouselList";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { SubCategoryNavItem } from "./SubCategoryNavItem";

interface SubCategoryNavSectionProps {
  availableSubCategories: readonly AvailableSubCategory[];
}

const SubCategoryNavSection = ({
  availableSubCategories,
}: SubCategoryNavSectionProps) => {
  if (availableSubCategories.length === 0) return null;

  return (
    <section className="container mx-auto py-4">
        <TypographyH2 id="sub-category-nav-heading" className="mb-4 border-none text-xl font-bold">
          카테고리 둘러보기
        </TypographyH2>
        <CarouselList
          id="sub-category-nav-heading"
          data={availableSubCategories}
          opts={{ align: "start", loop: false, dragFree: true }}
          renderItem={({ category, subCategory }) => (
            <SubCategoryNavItem category={category} subCategory={subCategory} />
          )}
        />
    </section>
  );
}

export { SubCategoryNavSection };
