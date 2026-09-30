import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { AdminPremiumFeatureListPage } from "@/core/domain/premium-feature";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { AdminPremiumFeatureListRequestSchema } from "@/core/schemas/request/adminPremiumFeatureList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getAdminPremiumFeaturesPageService } from "@/services/premiumFeature";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<AdminPremiumFeatureListPage>> => {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(AdminPremiumFeatureListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
      status: searchParams.get("status"),
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }
    return routeSuccess(await getAdminPremiumFeaturesPageService(parsed.data));
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
