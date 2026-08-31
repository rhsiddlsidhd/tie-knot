export const dynamic = "force-dynamic";

import { getAllPremiumFeatureService, verifySession } from "@/services";
import { NewProductTemplate } from "./_components";

export default async function NewProductPage() {
  await verifySession("ADMIN");

  const premiumFeatures = await getAllPremiumFeatureService();

  return <NewProductTemplate premiumFeatures={premiumFeatures} />;
}
