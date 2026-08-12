import type { APIRouteResponse} from "@/server/boundary";
import { routeSuccess, routeError } from "@/server/boundary";
import type { BanksResponse } from "@/shared/schemas";

export const GET = async (): Promise<APIRouteResponse<BanksResponse>> => {
  try {
    const res = await fetch("https://api.portone.io/banks");
    const { items }: { items: BanksResponse } = await res.json();
    return routeSuccess(items);
  } catch (error) {
    return routeError(error);
  }
};
