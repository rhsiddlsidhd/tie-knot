export const dynamic = "force-dynamic";

import { ProductCatalogTemplate } from "@/app/(main)/(products)/products/[category]/_components/ProductCatalogTemplate";
import { getPublicProductsPageService, getAvailableSubCategoriesService } from "@/services/product";
import { isProductCategory } from "@/core/utils/category";
import { productCategoryLabels } from "@/core/domain/product-category";
import { notFound } from "next/navigation";
import { resolveInitialSubCategory } from "@/app/(main)/(products)/products/[category]/_utils/resolveInitialSubCategory";

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

  const firstPage = await getPublicProductsPageService({
    category,
    subCategory: initialSubCategory === "all" ? undefined : initialSubCategory,
  });

  const currentCategoryLabel = productCategoryLabels[category];

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
