export const dynamic = "force-dynamic";

import { HomeTemplate } from "./_components";
import type { Product } from "@/services";
import {
  getAvailableSubCategoriesService,
  getPopularProductsService,
} from "@/services";
import type { AvailableSubCategory } from "@/core/domain";
import { POPULAR_PRODUCTS_LIMIT } from "@/core/domain";

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
