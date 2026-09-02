export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminUsersPageService } from "@/services/user";
import { adminUserListRequestSchema } from "@/core/schemas/request/adminUserList.schema";
import { decodeCursor } from "@/core/utils/cursor";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminUsersTemplate } from "@/app/(admin)/admin/users/_components/AdminUsersTemplate";

// 필터/커서는 URL이 소유하므로 어떤 입력이 와도 throw하지 않는다 — 유효하지 않은
// role은 스키마가, 형식이 깨진 cursor는 decodeCursor가 걸러 "필터/커서 없음"으로
// 떨어뜨린다. 그 뒤에도 남는 방어(예: 직접 조작된 요청)는 service의 AppError가 맡는다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(adminUserListRequestSchema, {
    role: typeof searchParams.role === "string" ? searchParams.role : null,
    cursor: typeof searchParams.cursor === "string" ? searchParams.cursor : null,
  });

  if (!parsed.success) return {};

  const { role, cursor } = parsed.data;
  if (cursor && !decodeCursor(cursor)) {
    return { role };
  }
  return { role, cursor };
};

const UsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const { role, cursor } = resolveFilters(await searchParams);
  const page = await getAdminUsersPageService({ role, cursor });

  return <AdminUsersTemplate page={page} role={role} cursor={cursor} />;
};

export default UsersPage;
