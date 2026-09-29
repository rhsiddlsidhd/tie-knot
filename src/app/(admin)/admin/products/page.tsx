export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { AdminProductsTable } from "@/app/(admin)/admin/products/_containers/AdminProductsTable";

export default async function ProductsPage() {
  await verifySession("ADMIN");

  return <AdminProductsTable />;
}
