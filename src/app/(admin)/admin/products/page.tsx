export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminProductsPageService } from "@/services/product";
import { AdminProductListRequestSchema } from "@/core/schemas/request/adminProductList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminProductsTemplate } from "@/app/(admin)/admin/products/_components/AdminProductsTemplate";

const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminProductListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    view: typeof searchParams.view === "string" ? searchParams.view : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction:
      typeof searchParams.direction === "string"
        ? searchParams.direction
        : null,
  });

  return parsed.success ? parsed.data : AdminProductListRequestSchema.parse({});
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await verifySession("ADMIN");

  const filters = resolveFilters(await searchParams);
  const page = await getAdminProductsPageService(filters);

  return <AdminProductsTemplate page={page} view={filters.view} q={filters.q} />;
}
