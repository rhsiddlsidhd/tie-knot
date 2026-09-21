import type { Product } from "@/core/domain/product";
import { PromotionHero } from "./PromotionHero";
import { LiveDemoSection } from "./LiveDemoSection";
import { SubCategoryNavigationSection } from "./SubCategoryNavigationSection";
import { PopularProductsSection } from "./PopularProductsSection";

interface HomeTemplateProps {
  popularProducts: Product[];
}

const HomeTemplate = ({ popularProducts }: HomeTemplateProps) => {
  return (
    <div className="flex flex-col">
      <PromotionHero />

      <SubCategoryNavigationSection />

      <PopularProductsSection products={popularProducts} />

      <LiveDemoSection />
    </div>
  );
};

export { HomeTemplate };
