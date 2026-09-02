import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import type { BanksResponse } from "@/core/schemas/response/banks.schema";

export const GET = async (): Promise<APIRouteResponse<BanksResponse>> => {
  try {
    const res = await fetch("https://api.portone.io/banks");
    const { items }: { items: BanksResponse } = await res.json();
    return routeSuccess(items);
  } catch (error) {
    return routeError(error);
  }
};
