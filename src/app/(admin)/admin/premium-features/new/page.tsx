export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { NewPremiumFeatureTemplate } from "@/app/(admin)/admin/premium-features/new/_components/NewPremiumFeatureTemplate";

export default async function NewPremiumFeaturePage() {
  await verifySession("ADMIN");

  return <NewPremiumFeatureTemplate />;
}
