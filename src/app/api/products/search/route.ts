import type { NextRequest } from "next/server";
import type { APIRouteResponse} from "@/server/boundary";
import { routeSuccess, routeError } from "@/server/boundary";
import { searchProductsService } from "@/server/services";
import type { ProductResponse} from "@/shared/schemas";
import { productSearchRequestSchema } from "@/shared/schemas";
import { validateAndFlatten } from "@/shared/utils";
import { AppError } from "@/shared/types";

export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = validateAndFlatten(productSearchRequestSchema, {
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
