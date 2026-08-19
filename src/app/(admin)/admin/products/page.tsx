export const dynamic = "force-dynamic";

import { getAllProductsService, verifySession } from "@/services";
import { AdminProductsTemplate } from "./_components";

export default async function ProductsPage() {
  await verifySession("ADMIN");

  const products = await getAllProductsService();

  return <AdminProductsTemplate products={products} />;
}
