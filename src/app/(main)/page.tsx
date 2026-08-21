export const dynamic = "force-dynamic";

import { HomeTemplate } from "./_components";
import type {
  Product} from "@/services";
import {
  getFeaturedTemplatesService,
  getPopularProductsService
} from "@/services";
import { POPULAR_PRODUCTS_LIMIT } from "@/core/domain";

const page = async () => {
  const [invitation, popularProducts] = await Promise.all([
    getFeaturedTemplatesService("invitation").catch(() => [] as Product[]),
    getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(() => [] as Product[]),
  ]);

  return (
    <HomeTemplate invitation={invitation} popularProducts={popularProducts} />
  );
};

export default page;
