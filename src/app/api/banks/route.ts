import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { fetchBanks } from "@/adapters/server/portone/banks";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

export const GET = async (): Promise<APIRouteResponse<BanksResponse>> => {
  try {
    return routeSuccess(await fetchBanks());
  } catch (error) {
    return routeError(error);
  }
};
