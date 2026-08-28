import { ProductFeatures } from "@/ui/components/organisms";
import type { Product, PremiumFeature } from "@/services";
import type { ReviewListPage, ReviewSortType } from "@/core/domain";
import { ProductSummary } from "./ProductSummary";
import { ProductViewTracker } from "./ProductViewTracker";
import { ReviewsSection } from "./ReviewsSection";

interface ProductDetailTemplateProps {
  product: Product;
  options: PremiumFeature[];
  reviews: ReviewListPage;
  sort: ReviewSortType;
}

const ProductDetailTemplate = ({
  product,
  options,
  reviews,
  sort,
}: ProductDetailTemplateProps) => {
  return (
    <main className="bg-background min-h-screen">
      <ProductViewTracker productId={product._id} />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-4xl">
          <ProductSummary product={product} options={options} />
          <ProductFeatures options={options} images={product.images} />
          <ReviewsSection reviews={reviews} sort={sort} />
        </div>
      </div>
    </main>
  );
};

export { ProductDetailTemplate };
