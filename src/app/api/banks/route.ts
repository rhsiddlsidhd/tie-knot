import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { fetchBanks } from "@/adapters/server/portone/banks";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

const GET = async (): Promise<ApiRouteResponse<BanksResponse>> => {
  try {
    return routeSuccess(await fetchBanks());
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
