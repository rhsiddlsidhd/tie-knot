"use client";

import { TypographyH2 } from "@/ui/components/atoms/typography";
import { CarouselList } from "@/ui/components/molecules/CarouselList";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { SubCategoryNavigationItem } from "./SubCategoryNavigationItem";

interface SubCategoryNavigationSectionProps {
  availableSubCategories: readonly AvailableSubCategory[];
}

const SubCategoryNavigationSection = ({
  availableSubCategories,
}: SubCategoryNavigationSectionProps) => {
  if (availableSubCategories.length === 0) return null;

  return (
    <section className="container mx-auto py-4">
        <TypographyH2 id="sub-category-nav-heading" className="mb-4 border-none text-xl font-bold">
          카테고리 둘러보기
        </TypographyH2>
        <CarouselList
          id="sub-category-nav-heading"
          opts={{ align: "start", loop: false, dragFree: true }}
        >
          {availableSubCategories.map(({ category, subCategory }) => (
            <SubCategoryNavigationItem
              key={`${category}-${subCategory}`}
              category={category}
              subCategory={subCategory}
            />
          ))}
        </CarouselList>
    </section>
  );
}

export { SubCategoryNavigationSection };
