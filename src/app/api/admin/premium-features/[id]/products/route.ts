import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import type { FeatureProductBindingPage } from "@/core/domain/premium-feature";
import { routeError, routeSuccess } from "@/boundary";
import { AppError } from "@/core/domain/error";
import { FeatureProductBindingListRequestSchema } from "@/core/schemas/request/featureProductBindingList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { requireAdmin } from "@/services/auth";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getFeatureProductBindingsPageService } from "@/services/product";

const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<ApiRouteResponse<FeatureProductBindingPage>> => {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) {
      throw new AppError("VALIDATION", "기능 ID 형식이 올바르지 않습니다.");
    }

    const [feature] = await getPremiumFeatureService([id]);
    if (!feature) {
      throw new AppError("NOT_FOUND", "프리미엄 기능을 찾을 수 없습니다.");
    }

    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(FeatureProductBindingListRequestSchema, {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
      sort: searchParams.get("sort"),
      direction: searchParams.get("direction"),
      attached: searchParams.get("attached"),
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }

    return routeSuccess(
      await getFeatureProductBindingsPageService({
        featureId: id,
        ...parsed.data,
      }),
    );
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
