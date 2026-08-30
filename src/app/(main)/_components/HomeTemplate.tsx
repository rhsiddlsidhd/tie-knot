import { EcommerceHero, LiveDemoSection } from "@/ui/components/organisms";
import type { Product } from "@/services";
import { SubCategoryNavSection } from "./SubCategoryNavSection";
import { PopularProductsSection } from "./PopularProductsSection";
import type { AvailableSubCategory } from "@/core/domain";

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
