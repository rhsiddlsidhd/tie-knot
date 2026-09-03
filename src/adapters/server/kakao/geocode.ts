import "server-only";
import { AppError } from "@/core/domain/error";
import type { KakaomapResponse } from "@/core/schemas/response/kakaomap.schema";

const GEOCODE_URL = "https://dapi.kakao.com/v2/local/search/address";

type KakaoErrorBody = { errorType?: string; message?: string };

/**
 * 카카오 로컬 API 주소 검색 — 청첩장 예식장 좌표를 얻는다.
 *
 * 카카오는 인증 실패·잘못된 파라미터를 상태코드로만 알리지 않고 200 본문의
 * `errorType`으로도 알린다. 그래서 `response.ok`만으로는 성공을 판정할 수 없다.
 */
export async function geocodeAddress(
  address: string,
): Promise<KakaomapResponse> {
  const restApiKey = process.env.KAKAO_REST_API_KEY;

  let response: Response;
  try {
    response = await fetch(
      `${GEOCODE_URL}?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${restApiKey}` } },
    );
  } catch (error) {
    throw new AppError(
      "EXTERNAL_SERVICE",
      `카카오맵 API 요청 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const text = await response.text();
  let data: KakaomapResponse & KakaoErrorBody;
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

  return data;
}
