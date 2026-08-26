export const dynamic = "force-dynamic";

import { getAllProductsService, verifySession } from "@/services";
import { AdminProductsTemplate } from "./_components";

const resolveView = (raw: string | string[] | undefined): "active" | "trash" =>
  raw === "trash" ? "trash" : "active";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await verifySession("ADMIN");

  const view = resolveView((await searchParams).view);
  const products = await getAllProductsService(undefined, undefined, view);

  return <AdminProductsTemplate products={products} view={view} />;
}
