import type { Product } from "@/core/domain/product";
import type { ProductCategory, SubCategory } from "@/core/domain/product-category";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";

import { ProductCatalog } from "@/app/(main)/(products)/products/[category]/_containers/ProductCatalog";

interface ProductCatalogTemplateProps {
  products: Product[];
  category: ProductCategory;
  categoryLabel: string;
  initialSubCategory: SubCategory | "all";
}

const ProductCatalogTemplate = ({
  products,
  category,
  categoryLabel,
  initialSubCategory,
}: ProductCatalogTemplateProps) => (
  <main className="bg-background min-h-screen">
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <TypographyH1 className="mb-4 text-4xl font-bold text-balance md:text-5xl">
            {categoryLabel}
          </TypographyH1>
          <TypographyMuted>
            당신의 스타일에 맞는 완벽한 {categoryLabel} 상품을 찾아보세요
          </TypographyMuted>
        </div>
        <ProductCatalog
          products={products}
          category={category}
          initialSubCategory={initialSubCategory}
        />
      </div>
    </div>
  </main>
);

export { ProductCatalogTemplate };
