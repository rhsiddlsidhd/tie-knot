import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { geocodeAddress } from "@/adapters/server/kakao/geocode";
import type { KakaomapResponse } from "@/core/schemas/response/kakaomap.schema";
import type { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<KakaomapResponse>> => {
  try {
    const { searchParams } = new URL(req.url);

    return routeSuccess(await geocodeAddress(searchParams.get("address") ?? ""));
  } catch (error) {
    return routeError(error);
  }
};
