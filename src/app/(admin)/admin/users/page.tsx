export const dynamic = "force-dynamic";

import { verifySession } from "@/services/auth";
import { getAdminUsersPageService } from "@/services/user";
import { AdminUserListRequestSchema } from "@/core/schemas/request/adminUserList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AdminUsersTemplate } from "@/app/(admin)/admin/users/_components/AdminUsersTemplate";

// 목록 파라미터는 URL이 소유하므로 유효하지 않은 입력은 기본 목록 조건으로 되돌린다.
const resolveFilters = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const parsed = validateAndFlatten(AdminUserListRequestSchema, {
    q: typeof searchParams.q === "string" ? searchParams.q : null,
    role: typeof searchParams.role === "string" ? searchParams.role : null,
    page: typeof searchParams.page === "string" ? searchParams.page : null,
    limit: typeof searchParams.limit === "string" ? searchParams.limit : null,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : null,
    direction: typeof searchParams.direction === "string" ? searchParams.direction : null,
  });

  return parsed.success ? parsed.data : AdminUserListRequestSchema.parse({});
};

const UsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  await verifySession("ADMIN");

  const filters = resolveFilters(await searchParams);
  const page = await getAdminUsersPageService(filters);

  return <AdminUsersTemplate page={page} q={filters.q} role={filters.role} />;
};

export default UsersPage;
