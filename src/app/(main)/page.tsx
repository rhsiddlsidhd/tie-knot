export const dynamic = "force-dynamic";

import { HomeTemplate } from "./_components";
import type { Product } from "@/services";
import {
  getAvailableSubCategoriesService,
  getFeaturedTemplatesService,
  getPopularProductsService,
} from "@/services";
import type { AvailableSubCategory } from "@/core/domain";
import { POPULAR_PRODUCTS_LIMIT } from "@/core/domain";

const page = async () => {
  const [invitation, popularProducts, availableSubCategories] =
    await Promise.all([
      getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
      getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(
        () => [] as Product[],
      ),
      getAvailableSubCategoriesService().catch(
        () => [] as AvailableSubCategory[],
      ),
    ]);

  return (
    <HomeTemplate
      invitation={invitation}
      popularProducts={popularProducts}
      availableSubCategories={availableSubCategories}
    />
  );
};

export default page;
