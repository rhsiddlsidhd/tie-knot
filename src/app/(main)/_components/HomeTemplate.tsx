import type { Product } from "@/core/domain/product";
import { EcommerceHero } from "./EcommerceHero";
import { LiveDemoSection } from "./LiveDemoSection";
import { SubCategoryNavSection } from "./SubCategoryNavSection";
import { PopularProductsSection } from "./PopularProductsSection";
import type { AvailableSubCategory } from "@/core/domain/product-category";

interface HomeTemplateProps {
  popularProducts: Product[];
  availableSubCategories: readonly AvailableSubCategory[];
}

const HomeTemplate = ({
  popularProducts,
  availableSubCategories,
}: HomeTemplateProps) => {
  return (
    <div className="flex flex-col">
      <EcommerceHero />

      <SubCategoryNavSection availableSubCategories={availableSubCategories} />

      <PopularProductsSection products={popularProducts} />

      <LiveDemoSection />
    </div>
  );
};

export { HomeTemplate };
