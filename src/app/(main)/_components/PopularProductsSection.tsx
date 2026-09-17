"use client";

import { TypographyH2 } from "@/ui/components/atoms/typography";
import { CarouselList } from "@/ui/components/molecules/CarouselList";
import { ProductCard } from "@/ui/components/molecules/ProductCard";
import type { Product } from "@/core/domain/product";
import { POPULAR_PRODUCTS_MIN_ITEMS } from "@/core/domain/product";

interface PopularProductsSectionProps {
  products: Product[];
}

const PopularProductsSection = ({ products }: PopularProductsSectionProps) => {
  if (products.length < POPULAR_PRODUCTS_MIN_ITEMS) return null;

  return (
    <section className="container mx-auto py-4">
        <TypographyH2 id="popular-products-heading" className="mb-4 border-none text-xl font-bold">
          인기 상품
        </TypographyH2>
        <CarouselList
          id="popular-products-heading"
          data={products}
          opts={{ align: "start", loop: false, dragFree: true }}
          className="w-[61.8%] sm:w-[38.2%] md:w-[23.6%]"
          renderItem={(product, index) => <ProductCard product={product} rank={index + 1} />}
        />
    </section>
  );
}

export { PopularProductsSection };
