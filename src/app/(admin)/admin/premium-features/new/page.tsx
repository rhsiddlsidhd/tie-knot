export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { NewPremiumFeatureTemplate } from "./_components";

export default async function NewPremiumFeaturePage() {
  await verifySession("ADMIN");

  return <NewPremiumFeatureTemplate />;
}
