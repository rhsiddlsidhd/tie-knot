export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ProductCatalogTemplate } from "@/app/(public)/products/[category]/_components/ProductCatalogTemplate";
import {
  getPublicProductsPageService,
  getAvailableSubCategoriesService,
} from "@/services/product";
import { isProductCategory } from "@/core/utils/category";
import { PRODUCT_CATEGORY_LABELS } from "@/core/domain/product-category";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/core/domain/routes";
import { resolveInitialSubCategory } from "@/app/(public)/products/[category]/_utils/resolveInitialSubCategory";

const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> => {
  const { category } = await params;

  // 유효하지 않은 세그먼트의 404는 page가 처리한다.
  if (!isProductCategory(category)) return {};

  const label = PRODUCT_CATEGORY_LABELS[category];

  return {
    title: label,
    description: `${label} 카테고리의 웨딩 상품을 Tie Knot에서 만나보세요.`,
  };
};

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ subCategory?: string | string[] }>;
}) {
  const { category } = await params;

  // 세그먼트 값이 유효한 ProductCategory가 아니면 404
  if (!isProductCategory(category)) {
    notFound();
  }

  // 탭에 노출할 서브카테고리는 "공개 상품이 하나 이상 있는 것"만이다 — 첫 페이지에
  // 실제로 로드된 상품 일부가 아니라 카테고리 전체를 기준으로 조회한다(더보기로
  // 아직 안 불러온 서브카테고리도 탭에는 항상 보여야 한다).
  const availableSubCategories = (
    await getAvailableSubCategoriesService(category)
  ).map(({ subCategory }) => subCategory);

  const { subCategory: querySubCategory } = await searchParams;
  const initialSubCategory = resolveInitialSubCategory(
    querySubCategory,
    availableSubCategories,
  );

  // 쿼리에 값은 있는데 필터로 쓸 수 없으면 URL과 화면 상태가 어긋난다
  // (`?subCategory=stamp`인데 필터는 "전체") — 쿼리를 떼서 둘을 맞춘다.
  if (querySubCategory !== undefined && initialSubCategory === "all") {
    redirect(ROUTES.products.byCategory(category));
  }

  const firstPage = await getPublicProductsPageService({
    category,
    subCategory: initialSubCategory === "all" ? undefined : initialSubCategory,
  });

  const currentCategoryLabel = PRODUCT_CATEGORY_LABELS[category];

  return (
    <ProductCatalogTemplate
      firstPage={firstPage}
      category={category}
      categoryLabel={currentCategoryLabel}
      availableSubCategories={availableSubCategories}
      initialSubCategory={initialSubCategory}
    />
  );
}

export { generateMetadata };
