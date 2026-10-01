import type { Product } from "@/core/domain/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { PromotionHero } from "./PromotionHero";
import { LiveDemoSection } from "./LiveDemoSection";
import { SubCategoryNavigationSection } from "./SubCategoryNavigationSection";
import { PopularProductsSection } from "./PopularProductsSection";

interface HomeTemplateProps {
  popularProducts: Product[];
  availableSubCategories: AvailableSubCategory[] | null;
}

const HomeTemplate = ({
  popularProducts,
  availableSubCategories,
}: HomeTemplateProps) => {
  return (
    <div className="flex flex-col">
      <PromotionHero />

      <SubCategoryNavigationSection
        availableSubCategories={availableSubCategories}
      />

      <PopularProductsSection products={popularProducts} />

      <LiveDemoSection />
    </div>
  );
};

export { HomeTemplate };
