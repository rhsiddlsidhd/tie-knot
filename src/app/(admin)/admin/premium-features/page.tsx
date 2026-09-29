export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { PremiumFeaturesTable } from "@/app/(admin)/admin/premium-features/_containers/PremiumFeaturesTable";

const PremiumFeaturesPage = async () => {
  await verifySession("ADMIN");

  return <PremiumFeaturesTable />;
};

export default PremiumFeaturesPage;
