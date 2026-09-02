export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { AdminSettingsTemplate } from "@/app/(admin)/admin/settings/_components/AdminSettingsTemplate";

const SettingsPage = async () => {
  await verifySession("ADMIN");

  return <AdminSettingsTemplate />;
};

export default SettingsPage;
