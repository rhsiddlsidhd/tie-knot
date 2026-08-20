import "server-only";
import { unstable_cache } from "next/cache";
import { fetchSeoulOpenApi } from "@/adapters/server/seoul-open-api/request";

const SERVICE_NAME = "SearchSTNBySubwayLineInfo";
const CACHE_REVALIDATE_SECONDS = 60 * 60 * 24;

type SubwayLineInfoRow = {
  STATION_NM: string;
};

// 역 목록은 거의 안 바뀐다 — 저장 시점 검증/드롭다운 둘 다 매 요청마다 799건 외부 API를 다시 안 부르도록 하루 캐시.
// fetch 레벨 next.revalidate 대신 unstable_cache를 쓴다 — 서울 API는 인증키 오류/한도초과 시에도
// HTTP 200으로 응답하는데, fetch의 Data Cache는 상태코드 200만 보고 캐싱 여부를 정하므로(Next 내부
// patch-fetch.js) 그 경로로는 실패 응답도 그대로 하루 캐시에 눌러앉는다. unstable_cache는 콜백이
// throw하면 캐시 쓰기 자체를 건너뛰므로, 실패가 캐시에 갇히는 문제가 없다.
const getCachedSubwayStationNames = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await fetchSeoulOpenApi<SubwayLineInfoRow>(SERVICE_NAME, [1, 1000]);
    return [...new Set(rows.map((row) => row.STATION_NM))];
  },
  ["subway-station-names"],
  { revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function getAllSubwayStationNames(): Promise<string[]> {
  return getCachedSubwayStationNames();
}

export async function isValidSubwayStationName(name: string): Promise<boolean> {
  const names = await getAllSubwayStationNames();
  return names.includes(name);
}
