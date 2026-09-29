import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { AdminOrderListPage } from "@/core/domain/order";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { AdminOrderListRequestSchema } from "@/core/schemas/request/adminOrderList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getAdminOrdersPageService } from "@/services/order";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<AdminOrderListPage>> => {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(AdminOrderListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      status: searchParams.get("status"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }
    return routeSuccess(await getAdminOrdersPageService(parsed.data));
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
