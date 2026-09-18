import type { Product } from "@/core/domain/product";
import { PromotionHero } from "./PromotionHero";
import { LiveDemoSection } from "./LiveDemoSection";
import { SubCategoryNavSection } from "./SubCategoryNavSection";
import { PopularProductsSection } from "./PopularProductsSection";
import type { AvailableSubCategory } from "@/core/domain/product-category";

interface HomeTemplateProps {
  popularProducts: Product[];
  availableSubCategories: readonly AvailableSubCategory[];
  liveDemoThumbnail: string | null;
}

const HomeTemplate = ({
  popularProducts,
  availableSubCategories,
  liveDemoThumbnail,
}: HomeTemplateProps) => {
  return (
    <div className="flex flex-col">
      <PromotionHero />

      <SubCategoryNavSection availableSubCategories={availableSubCategories} />

      <PopularProductsSection products={popularProducts} />

      <LiveDemoSection thumbnail={liveDemoThumbnail} />
    </div>
  );
};

export { HomeTemplate };
