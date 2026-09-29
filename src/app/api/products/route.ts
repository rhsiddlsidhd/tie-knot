import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getPublicProductsPageService } from "@/services/product";
import { ProductListRequestSchema } from "@/core/schemas/request/productList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AppError } from "@/core/domain/error";
import type { PublicProductListPage } from "@/core/domain/product";

/**
 * 상품 목록의 "더보기" 전용.
 */
const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<PublicProductListPage>> => {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(ProductListRequestSchema, {
      category: searchParams.get("category"),
      subCategory: searchParams.get("subCategory"),
      cursor: searchParams.get("cursor"),
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }

    const page = await getPublicProductsPageService(parsed.data);

    return routeSuccess(page);
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
