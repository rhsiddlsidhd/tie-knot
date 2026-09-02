export const dynamic = "force-dynamic";

import { PremiumFeaturesTemplate } from "@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate";
import { getAllPremiumFeatureService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";

export default async function PremiumFeaturesPage() {
  await verifySession("ADMIN");

  const features = await getAllPremiumFeatureService();

  return <PremiumFeaturesTemplate features={features} />;
}
