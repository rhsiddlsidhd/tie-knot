import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAllSubwayStationNames } from "@/services/subway";
import type { SubwayStationsResponse } from "@/core/schemas/response/subway.schema";

const GET = async (): Promise<ApiRouteResponse<SubwayStationsResponse>> => {
  try {
    const stationNames = (await getAllSubwayStationNames()).sort((a, b) =>
      a.localeCompare(b, "ko"),
    );

    const stations: SubwayStationsResponse = stationNames.map((name) => ({
      value: name,
      label: `${name}역`,
    }));

    return routeSuccess(stations);
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
