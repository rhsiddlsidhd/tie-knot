export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { AdminUsersTable } from "@/app/(admin)/admin/users/_containers/AdminUsersTable";

const UsersPage = async () => {
  await verifySession("ADMIN");

  return <AdminUsersTable />;
};

export default UsersPage;
