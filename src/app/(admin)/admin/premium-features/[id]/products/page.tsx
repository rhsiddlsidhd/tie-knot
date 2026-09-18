export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { FeatureProductBindingTemplate } from "@/app/(admin)/admin/premium-features/[id]/products/_components/FeatureProductBindingTemplate";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getFeatureProductBindingsPageService } from "@/services/product";
import { verifySession } from "@/services/auth";
import { FeatureProductBindingListRequestSchema } from "@/core/schemas/request/featureProductBindingList.schema";
import { decodeCursor } from "@/core/utils/cursor";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";

// q와 cursor는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 형식이 깨진
// cursor는 decodeCursor가, 너무 긴 검색어는 스키마가 걸러 "조건 없음"으로 떨어뜨린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(FeatureProductBindingListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    cursor:
      typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { q, cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) return { q };
  return { q, cursor };
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

  const { q, cursor } = resolveFilters(await searchParams);
  const page = await getFeatureProductBindingsPageService({
    featureId: id,
    q,
    cursor,
  });

  return (
    <FeatureProductBindingTemplate
      featureId={id}
      featureLabel={feature.label}
      page={page}
      q={q}
      cursor={cursor}
    />
  );
};

export default FeatureProductsPage;
