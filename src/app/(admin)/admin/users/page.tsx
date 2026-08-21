export const dynamic = "force-dynamic";

import { verifySession } from "@/services";
import { AdminUsersTemplate } from "./_components";

const UsersPage = async () => {
  await verifySession("ADMIN");

  return <AdminUsersTemplate />;
};

export default UsersPage;
