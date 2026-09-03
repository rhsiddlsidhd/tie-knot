import "server-only";
import { unstable_cache } from "next/cache";
import { fetchSeoulOpenApi } from "@/adapters/server/seoul-open-api/request";
import { AppError } from "@/core/domain/error";
import {
  SUBWAY_LINE_COLORS,
  DEFAULT_SUBWAY_LINE_COLOR,
} from "@/core/domain/subway";
import type { SubwayStationLineInfoResponse } from "@/core/schemas/response/subway.schema";

const STATION_LIST_SERVICE_NAME = "SearchSTNBySubwayLineInfo";
const STATION_LINE_SERVICE_NAME = "SearchInfoBySubwayNameService";
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
    const rows = await fetchSeoulOpenApi<SubwayLineInfoRow>(STATION_LIST_SERVICE_NAME, [1, 1000]);
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

type SubwayNameSearchRow = {
  STATION_NM: string;
  LINE_NUM: string;
};

// 한 역이 환승역이면 노선 수만큼 행이 내려온다 — 노선명으로 합친 뒤 표시용 색상을 붙인다.
// 역 목록(위)과 달리 캐시하지 않는다: 입력 역명마다 키가 갈려 캐시 적중률이 낮고,
// 청첩장 저장 시점에 한 번 부르는 경로라 매 요청 비용이 문제되지 않는다.
export async function getSubwayStationLines(
  station: string,
): Promise<SubwayStationLineInfoResponse> {
  const rows = await fetchSeoulOpenApi<SubwayNameSearchRow>(
    STATION_LINE_SERVICE_NAME,
    [1, 50, station],
  );

  if (rows.length === 0) {
    throw new AppError("NOT_FOUND", "해당 역을 찾을 수 없습니다.");
  }

  const uniqueLineNames = [...new Set(rows.map((row) => row.LINE_NUM))];

  return {
    station,
    lines: uniqueLineNames.map((name) => ({
      name,
      color: SUBWAY_LINE_COLORS[name] ?? DEFAULT_SUBWAY_LINE_COLOR,
    })),
  };
}
