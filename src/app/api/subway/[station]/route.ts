import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { AppError } from "@/core/domain";
import { fetchSeoulOpenApi } from "@/adapters/server/seoul-open-api/request";
import { SUBWAY_LINE_COLORS, DEFAULT_SUBWAY_LINE_COLOR } from "@/core/domain";
import type { SubwayStationLineInfoResponse } from "@/core/schemas";
import type { NextRequest } from "next/server";

const SERVICE_NAME = "SearchInfoBySubwayNameService";

type SubwayNameSearchRow = {
  STATION_NM: string;
  LINE_NUM: string;
};

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ station: string }> },
): Promise<APIRouteResponse<SubwayStationLineInfoResponse>> => {
  try {
    const { station } = await params;

    const rows = await fetchSeoulOpenApi<SubwayNameSearchRow>(SERVICE_NAME, [1, 50, station]);

    if (rows.length === 0) {
      throw new AppError("NOT_FOUND", "해당 역을 찾을 수 없습니다.");
    }

    const uniqueLineNames = [...new Set(rows.map((row) => row.LINE_NUM))];

    const lines = uniqueLineNames.map((name) => ({
      name,
      color: SUBWAY_LINE_COLORS[name] ?? DEFAULT_SUBWAY_LINE_COLOR,
    }));

    return routeSuccess({ station, lines });
  } catch (error) {
    return routeError(error);
  }
};
