export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { FeatureProductBindingTemplate } from "@/app/(admin)/admin/premium-features/[id]/products/_components/FeatureProductBindingTemplate";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getFeatureProductBindingsPageService } from "@/services/product";
import { verifySession } from "@/services/auth";
import { FeatureProductBindingListRequestSchema } from "@/core/schemas/request/featureProductBindingList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

// 목록 파라미터는 URL이 소유하므로 유효하지 않은 입력은 기본 목록 조건으로 되돌린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(FeatureProductBindingListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction:
      typeof searchParams.direction === "string"
        ? searchParams.direction
        : null,
  });

  return parsed.success
    ? parsed.data
    : FeatureProductBindingListRequestSchema.parse({});
};

const FeatureProductsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const { id } = await params;
  const [feature] = await getPremiumFeatureService([id]);
  if (!feature) notFound();

  const filters = resolveFilters(await searchParams);
  const page = await getFeatureProductBindingsPageService({
    featureId: id,
    ...filters,
  });

  return (
    <FeatureProductBindingTemplate
      featureId={id}
      featureLabel={feature.label}
      page={page}
      q={filters.q}
    />
  );
};

export default FeatureProductsPage;
