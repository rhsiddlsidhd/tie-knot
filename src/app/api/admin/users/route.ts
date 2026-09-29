import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { AdminUserListPage } from "@/core/domain/user";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { AdminUserListRequestSchema } from "@/core/schemas/request/adminUserList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getAdminUsersPageService } from "@/services/user";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<AdminUserListPage>> => {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(AdminUserListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      role: searchParams.get("role"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }
    return routeSuccess(await getAdminUsersPageService(parsed.data));
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
