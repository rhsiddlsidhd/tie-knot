export const dynamic = "force-dynamic";

import { PremiumFeaturesTemplate } from "@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate";
import { getAdminPremiumFeaturesPageService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";
import { AdminPremiumFeatureListRequestSchema } from "@/core/schemas/request/adminPremiumFeatureList.schema";
import { decodeCursor } from "@/core/utils/cursor";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

// 커서는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 형식이 깨진 cursor는
// decodeCursor가 걸러 "커서 없음"으로 떨어뜨린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminPremiumFeatureListRequestSchema, {
    cursor:
      typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) return {};
  return { cursor };
};

const PremiumFeaturesPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const { cursor } = resolveFilters(await searchParams);
  const page = await getAdminPremiumFeaturesPageService({ cursor });

  return <PremiumFeaturesTemplate page={page} cursor={cursor} />;
};

export default PremiumFeaturesPage;
