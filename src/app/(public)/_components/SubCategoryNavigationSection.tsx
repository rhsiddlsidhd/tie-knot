"use client";

import { TypographyH2 } from "@/ui/components/atoms/typography";
import { CarouselList } from "@/ui/components/molecules/CarouselList";
import {
  PRODUCT_CATEGORIES,
  SUB_CATEGORY_MAP,
} from "@/core/domain/product-category";
import { SubCategoryNavigationItem } from "./SubCategoryNavigationItem";

const SubCategoryNavigationSection = () => {
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
        {PRODUCT_CATEGORIES.flatMap((category) =>
          SUB_CATEGORY_MAP[category].map((subCategory) => (
            <SubCategoryNavigationItem
              key={`${category}-${subCategory}`}
              category={category}
              subCategory={subCategory}
            />
          )),
        )}
      </CarouselList>
    </section>
  );
};

export { SubCategoryNavigationSection };
