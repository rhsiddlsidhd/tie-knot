export const revalidate = 600;

import { HomeTemplate } from "@/app/(public)/_components/HomeTemplate";
import { POPULAR_PRODUCTS_LIMIT, type Product } from "@/core/domain/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";
import {
  getAvailableSubCategoriesService,
  getPopularProductsService,
} from "@/services/product";

const page = async () => {
  // 카테고리 둘러보기는 헤더 nav와 같은 조회를 쓴다 — 공개 상품이 없는
  // 서브카테고리 링크는 클릭해도 전체 목록으로 되돌아가 죽은 링크가 된다.
  const [popularProducts, availableSubCategories] = await Promise.all([
    getPopularProductsService(POPULAR_PRODUCTS_LIMIT).catch(
      () => [] as Product[],
    ),
    getAvailableSubCategoriesService().catch(
      (): AvailableSubCategory[] | null => null,
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
