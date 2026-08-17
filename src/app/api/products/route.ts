import type { NextRequest } from "next/server";
import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAllProductsService } from "@/services";
import type { ProductResponse } from "@/core/schemas";
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<ProductResponse[]>> => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const products = await getAllProductsService(category);

    return routeSuccess(products);
  } catch (error) {
    return routeError(error);
  }
};
