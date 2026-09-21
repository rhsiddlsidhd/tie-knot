export const revalidate = 600;

import { HomeTemplate } from "@/app/(public)/_components/HomeTemplate";
import { POPULAR_PRODUCTS_LIMIT, type Product } from "@/core/domain/product";
import { getPopularProductsService } from "@/services/product";

const page = async () => {
  const popularProducts = await getPopularProductsService(
    POPULAR_PRODUCTS_LIMIT,
  ).catch(() => [] as Product[]);

  return <HomeTemplate popularProducts={popularProducts} />;
};

export default page;
