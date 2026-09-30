export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { AdminOrdersTable } from "@/app/(admin)/admin/orders/_containers/AdminOrdersTable";

const OrdersPage = async () => {
  await verifySession("ADMIN");

  return <AdminOrdersTable />;
};

export default OrdersPage;
