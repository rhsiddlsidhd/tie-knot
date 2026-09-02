export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminOrdersPageService } from "@/services/order";
import { adminOrderListRequestSchema } from "@/core/schemas/request/adminOrderList.schema";
import { decodeCursor } from "@/core/utils/cursor";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminOrdersTemplate } from "./_components";

// 필터/커서는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 유효하지 않은
// status는 스키마가, 형식이 깨진 cursor는 decodeCursor가 걸러 "필터/커서 없음"으로
// 떨어뜨린다. 그 뒤에도 남는 방어(예: 직접 조작된 요청)는 service의 AppError가 맡는다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(adminOrderListRequestSchema, {
    status: typeof searchParams.status === "string" ? searchParams.status : null,
    cursor: typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { status, cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) {
    return { status };
  }
  return { status, cursor };
};

const OrdersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const { status, cursor } = resolveFilters(await searchParams);
  const page = await getAdminOrdersPageService({ status, cursor });

  return <AdminOrdersTemplate page={page} status={status} cursor={cursor} />;
};

export default OrdersPage;
