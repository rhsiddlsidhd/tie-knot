import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { searchProductsService } from "@/services/product";
import type { ProductResponse } from "@/core/schemas/response/product.schema";
import { ProductSearchRequestSchema } from "@/core/schemas/request/productSearch.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AppError } from "@/core/domain/error";

const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = validateAndFlatten(ProductSearchRequestSchema, {
      q: searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "검색어를 확인해주세요.", parsed.error);
    }

    const products = await searchProductsService(parsed.data.q);

    return routeSuccess(products);
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
