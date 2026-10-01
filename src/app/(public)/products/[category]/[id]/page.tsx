export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { ProductDetailTemplate } from "@/app/(public)/products/[category]/[id]/_components/ProductDetailTemplate";
import { getAuth } from "@/services/auth";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getProductReviewsPageService } from "@/services/review";
import { getProductService } from "@/services/product";
import { ProductReviewListRequestSchema } from "@/core/schemas/request/productReviewList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

import { notFound } from "next/navigation";

const resolveReviewQuery = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(ProductReviewListRequestSchema, {
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    reviewCursor:
      typeof searchParams.reviewCursor === "string"
        ? searchParams.reviewCursor
        : null,
  });

  return parsed.success ? parsed.data : {};
};

// page와 같은 getProductService(id) 호출이라 cache()로 한 렌더 패스에 한 번만 조회된다.
// openGraph/twitter는 상위 값을 통째로 대체(얕은 병합)하므로 공통 필드까지 다시 적는다.
const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;

  const product = await getProductService(id);

  // 존재하지 않는 상품의 404는 page가 처리한다.
  if (!product) return {};

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: [product.thumbnail],
      siteName: "Tie Knot",
      type: "website",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description,
      images: [product.thumbnail],
    },
  };
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

export { generateMetadata };
