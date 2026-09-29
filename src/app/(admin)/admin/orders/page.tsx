export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminOrdersPageService } from "@/services/order";
import { AdminOrderListRequestSchema } from "@/core/schemas/request/adminOrderList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminOrdersTemplate } from "@/app/(admin)/admin/orders/_components/AdminOrdersTemplate";

const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminOrderListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    status:
      typeof searchParams.status === "string" ? searchParams.status : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction: typeof searchParams.direction === "string" ? searchParams.direction : null,
  });

  return parsed.success ? parsed.data : AdminOrderListRequestSchema.parse({});
};

const OrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const filters = resolveFilters(await searchParams);
  const page = await getAdminOrdersPageService(filters);

  return <AdminOrdersTemplate page={page} q={filters.q} status={filters.status} />;
};

export default OrdersPage;
