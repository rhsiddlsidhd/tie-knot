import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { AdminProductListPage } from "@/core/domain/product";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { AdminProductListRequestSchema } from "@/core/schemas/request/adminProductList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getAdminProductsPageService } from "@/services/product";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<AdminProductListPage>> => {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(AdminProductListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
      softDeleted: searchParams.get("softDeleted"),
      status: searchParams.get("status"),
      type: searchParams.get("type"),
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }

    return routeSuccess(await getAdminProductsPageService(parsed.data));
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
