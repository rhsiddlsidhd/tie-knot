import { redirect } from "next/navigation";
import { ROUTES } from "@/core/domain/routes";

const AdminIndexPage = () => {
  redirect(ROUTES.admin.dashboard);
};

export default AdminIndexPage;
