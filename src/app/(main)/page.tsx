export const dynamic = "force-dynamic";

import { HomeTemplate } from "@/app/(main)/_components/HomeTemplate";
import type { Product } from "@/core/domain/product";
import {
  getAvailableSubCategoriesService,
  getPopularProductsService,
  getPublicProductsPageService,
} from "@/services/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { POPULAR_PRODUCTS_LIMIT } from "@/core/domain/product";

// LiveDemoSection 대표 이미지용 — 특정 상품 id를 고정하면 그 상품이 삭제/교체될 때
// 조용히 깨지므로, 테마로 조회해 살아있는 blossom 상품 중 하나의 썸네일을 쓴다.
const LIVE_DEMO_THEME = "blossom";

const getLiveDemoThumbnail = async (): Promise<string | null> => {
  try {
    const { items } = await getPublicProductsPageService({
      category: MOBILE_INVITATION_CATEGORY,
      theme: LIVE_DEMO_THEME,
      limit: 1,
    });
    return items[0]?.thumbnail ?? null;
  } catch {
    return null;
  }
};

const page = async () => {
  const [popularProducts, availableSubCategories, liveDemoThumbnail] =
    await Promise.all([
      getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(
        () => [] as Product[],
      ),
      getAvailableSubCategoriesService().catch(
        () => [] as AvailableSubCategory[],
      ),
      getLiveDemoThumbnail(),
    ]);

  return (
    <HomeTemplate
      popularProducts={popularProducts}
      availableSubCategories={availableSubCategories}
      liveDemoThumbnail={liveDemoThumbnail}
    />
  );
};

export default page;
