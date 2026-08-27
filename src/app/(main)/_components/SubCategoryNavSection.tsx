"use client";

import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  TypographyH2,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/ui/components/atoms";
import type { AvailableSubCategory } from "@/core/domain";
import { SubCategoryNavItem } from "./SubCategoryNavItem";

interface SubCategoryNavSectionProps {
  availableSubCategories: readonly AvailableSubCategory[];
}

export function SubCategoryNavSection({
  availableSubCategories,
}: SubCategoryNavSectionProps) {
  if (availableSubCategories.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <TypographyH2 className="mb-4 border-none text-xl font-bold">
          카테고리 둘러보기
        </TypographyH2>
        <Carousel
          aria-label="서브카테고리 바로가기"
          opts={{ align: "start", loop: false, dragFree: true }}
          plugins={[WheelGesturesPlugin()]}
        >
          <CarouselContent>
            {availableSubCategories.map(({ category, subCategory }) => (
              <CarouselItem
                key={`${category}-${subCategory}`}
                className="basis-auto"
              >
                <SubCategoryNavItem
                  category={category}
                  subCategory={subCategory}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
