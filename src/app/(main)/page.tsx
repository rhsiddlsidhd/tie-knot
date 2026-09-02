export const dynamic = "force-dynamic";

import { HomeTemplate } from "@/app/(main)/_components/HomeTemplate";
import type { Product } from "@/services/product";
import { getAvailableSubCategoriesService, getPopularProductsService } from "@/services/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { POPULAR_PRODUCTS_LIMIT } from "@/core/domain/product";

const page = async () => {
  const [popularProducts, availableSubCategories] = await Promise.all([
    getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(
      () => [] as Product[],
    ),
    getAvailableSubCategoriesService().catch(
      () => [] as AvailableSubCategory[],
    ),
  ]);

  return (
    <HomeTemplate
      popularProducts={popularProducts}
      availableSubCategories={availableSubCategories}
    />
  );
};

export default page;
