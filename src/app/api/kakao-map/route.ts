import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { geocodeAddress } from "@/adapters/server/kakao/geocode";
import { AppError } from "@/core/domain/error";
import type { KakaomapResponse } from "@/core/schemas/response/kakaomap.schema";
import type { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<KakaomapResponse>> => {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
      throw new AppError("VALIDATION", "주소를 입력해주세요.");
    }

    return routeSuccess(await geocodeAddress(address));
  } catch (error) {
    return routeError(error);
  }
};
