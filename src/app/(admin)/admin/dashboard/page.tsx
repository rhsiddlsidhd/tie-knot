export const dynamic = "force-dynamic";

import { verifySession, getDashboardStatsService } from "@/services";
import { AdminDashboardTemplate } from "./_components";

export default async function AdminDashboard() {
  await verifySession("ADMIN");
  const stats = await getDashboardStatsService();

  return <AdminDashboardTemplate stats={stats} />;
}
