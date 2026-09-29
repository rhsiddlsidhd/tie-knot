import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { AdminReviewListPage } from "@/core/domain/review";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { AdminReviewListRequestSchema } from "@/core/schemas/request/adminReviewList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getAdminReviewsPageService } from "@/services/review";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<AdminReviewListPage>> => {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(AdminReviewListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }
    return routeSuccess(await getAdminReviewsPageService(parsed.data));
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
