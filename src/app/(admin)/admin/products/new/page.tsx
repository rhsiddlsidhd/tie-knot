export const dynamic = "force-dynamic";

import { getSelectablePremiumFeatureService } from "@/services/premiumFeature";
import { verifySession } from "@/services/auth";
import { NewProductTemplate } from "@/app/(admin)/admin/products/new/_components/NewProductTemplate";

export default async function NewProductPage() {
  await verifySession("ADMIN");

  const premiumFeatures = await getSelectablePremiumFeatureService();

  return <NewProductTemplate premiumFeatures={premiumFeatures} />;
}
