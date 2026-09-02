import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { AppError } from "@/core/domain/error";
import type { KakaomapResponse } from "@/core/schemas/response/kakaomap.schema";
import type { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<KakaomapResponse>> => {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

    let response: Response;
    try {
      response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address?query=${address}`,
        {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
        },
      );
    } catch (error) {
      throw new AppError(
        "EXTERNAL_SERVICE",
        `카카오맵 API 요청 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const text = await response.text();
    let data: KakaomapResponse & { errorType?: string; message?: string };
    try {
      data = JSON.parse(text);
    } catch {
      throw new AppError(
        "EXTERNAL_SERVICE",
        `카카오맵 API가 JSON이 아닌 응답을 반환함 (status=${response.status}): ${text.slice(0, 300)}`,
      );
    }

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
