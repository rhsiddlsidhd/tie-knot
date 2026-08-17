import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { AppError } from "@/core/domain";
import type { KakaomapResponse } from "@/core/schemas";
import type { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<KakaomapResponse>> => {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address?query=${address}`,
      {
        headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
      },
    );

    const data = await response.json();

    if (!response.ok || data.errorType) {
      throw new AppError(
        "EXTERNAL_SERVICE",
        data.message ?? "주소 검색에 실패했습니다.",
      );
    }

    return routeSuccess(data);
  } catch (error) {
    return routeError(error);
  }
};
