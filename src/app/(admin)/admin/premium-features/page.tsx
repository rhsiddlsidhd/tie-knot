export const dynamic = "force-dynamic";

import { PremiumFeaturesTemplate } from "@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate";
import { getAdminPremiumFeaturesPageService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";
import { AdminPremiumFeatureListRequestSchema } from "@/core/schemas/request/adminPremiumFeatureList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

// 목록 파라미터는 URL이 소유하므로 유효하지 않은 입력은 기본 목록 조건으로 되돌린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminPremiumFeatureListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction: typeof searchParams.direction === "string" ? searchParams.direction : null,
  });

  return parsed.success
    ? parsed.data
    : AdminPremiumFeatureListRequestSchema.parse({});
};

const PremiumFeaturesPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const filters = resolveFilters(await searchParams);
  const page = await getAdminPremiumFeaturesPageService(filters);

  return <PremiumFeaturesTemplate page={page} q={filters.q} />;
};

export default PremiumFeaturesPage;
