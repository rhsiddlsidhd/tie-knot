export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminProductsPageService } from "@/services/product";
import { adminProductListRequestSchema } from "@/core/schemas";
import { decodeCursor, validateAndFlatten } from "@/core/utils";
import { AdminProductsTemplate } from "./_components";

// 필터/커서는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 유효하지 않은
// view는 스키마가, 형식이 깨진 cursor는 decodeCursor가 걸러 "필터/커서 없음"으로
// 떨어뜨린다. 그 뒤에도 남는 방어(예: 직접 조작된 요청)는 service의 AppError가 맡는다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(adminProductListRequestSchema, {
    view: typeof searchParams.view === "string" ? searchParams.view : null,
    cursor: typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { view, cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) {
    return { view };
  }
  return { view, cursor };
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await verifySession("ADMIN");

  const { view = "active", cursor } = resolveFilters(await searchParams);
  const page = await getAdminProductsPageService({ view, cursor });

  return <AdminProductsTemplate page={page} view={view} cursor={cursor} />;
}
