export const dynamic = "force-dynamic";

import { getAllPremiumFeatureService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";
import { NewProductTemplate } from "./_components";

export default async function NewProductPage() {
  await verifySession("ADMIN");

  const premiumFeatures = await getAllPremiumFeatureService();

  return <NewProductTemplate premiumFeatures={premiumFeatures} />;
}
