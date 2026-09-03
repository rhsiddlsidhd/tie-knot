import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getSubwayStationLines } from "@/services/subway";
import type { SubwayStationLineInfoResponse } from "@/core/schemas/response/subway.schema";
import type { NextRequest } from "next/server";

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ station: string }> },
): Promise<APIRouteResponse<SubwayStationLineInfoResponse>> => {
  try {
    const { station } = await params;

    return routeSuccess(await getSubwayStationLines(station));
  } catch (error) {
    return routeError(error);
  }
};
