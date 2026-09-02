export const dynamic = "force-dynamic";

import { ProductCatalogTemplate } from "./_components";
import { getPublicProductsService } from "@/services/product";
import { getAvailableSubCategories, isProductCategory } from "@/core/utils";
import { productCategoryLabels } from "@/core/domain";
import { notFound } from "next/navigation";
import { resolveInitialSubCategory } from "./_utils";

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

  const products = await getPublicProductsService(category);
  const availableSubCategories = getAvailableSubCategories(category, products);
  const { subCategory } = await searchParams;
  const initialSubCategory = resolveInitialSubCategory(
    subCategory,
    availableSubCategories,
  );

  const currentCategoryLabel = productCategoryLabels[category];

  return (
    <ProductCatalogTemplate
      products={products}
      category={category}
      categoryLabel={currentCategoryLabel}
      initialSubCategory={initialSubCategory}
    />
  );
}
