export const dynamic = "force-dynamic";

import { verifySession } from "@/services";
import { AdminSettingsTemplate } from "./_components";

const SettingsPage = async () => {
  await verifySession("ADMIN");

  return <AdminSettingsTemplate />;
};

export default SettingsPage;
