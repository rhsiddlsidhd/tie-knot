import type { APIRouteResponse} from "@/server/boundary";
import { routeSuccess, routeError } from "@/server/boundary";
import { getAuth } from "@/server/services";
import type { AuthSessionResponse } from "@/core/schemas";

export const GET = async (): Promise<
  APIRouteResponse<AuthSessionResponse>
> => {
  try {
    const session = await getAuth();
    return routeSuccess(session);
  } catch (e) {
    return routeError(e);
  }
};
