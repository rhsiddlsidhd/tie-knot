import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAllSubwayStationNames } from "@/services";
import type { SubwayStationsResponse } from "@/core/schemas";

export const GET = async (): Promise<
  APIRouteResponse<SubwayStationsResponse>
> => {
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
