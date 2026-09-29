export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { FeatureProductBindingTable } from "@/app/(admin)/admin/premium-features/[id]/products/_containers/FeatureProductBindingTable";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";

const FeatureProductsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  await verifySession("ADMIN");

  const { id } = await params;
  const [feature] = await getPremiumFeatureService([id]);
  if (!feature) notFound();

  return (
    <FeatureProductBindingTable featureId={id} featureLabel={feature.label} />
  );
};

export default FeatureProductsPage;
