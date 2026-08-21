export const dynamic = "force-dynamic";

import { verifySession } from "@/services";
import { AdminOrdersTemplate } from "./_components";

const OrdersPage = async () => {
  await verifySession("ADMIN");

  return <AdminOrdersTemplate />;
};

export default OrdersPage;
