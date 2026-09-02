export const dynamic = "force-dynamic";

import { ProductDetailTemplate } from "@/app/(main)/(products)/products/[category]/[id]/_components/ProductDetailTemplate";
import { getAuth } from "@/services/auth";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getProductReviewsPageService } from "@/services/review";
import { getProductService } from "@/services/product";
import { productReviewListRequestSchema } from "@/core/schemas/request/productReviewList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

import { notFound } from "next/navigation";

const resolveReviewQuery = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(productReviewListRequestSchema, {
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    reviewCursor:
      typeof searchParams.reviewCursor === "string"
        ? searchParams.reviewCursor
        : null,
  });

  return parsed.success ? parsed.data : {};
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const product = await getProductService(id);

  if (!product) notFound();
  const options = await getPremiumFeatureService(product.featureIds);

  const { sort = "LATEST", reviewCursor } = resolveReviewQuery(
    await searchParams,
  );
  const session = await getAuth();
  const reviews = await getProductReviewsPageService({
    productId: product._id,
    sort,
    cursor: reviewCursor,
    viewerUserId: session?.userId,
  });

  return (
    <ProductDetailTemplate
      product={product}
      options={options}
      reviews={reviews}
      sort={sort}
    />
  );
}
