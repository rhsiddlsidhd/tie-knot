import { redirect } from "next/navigation";
import { ROUTES } from "@/core/domain/routes";
import { verifySession } from "@/services/auth";

const AdminIndexPage = async () => {
  await verifySession("ADMIN");
  redirect(ROUTES.admin.dashboard);
};

export default AdminIndexPage;
