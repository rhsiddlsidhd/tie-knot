import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAuth } from "@/services/auth";
import type { AuthSessionResponse } from "@/core/schemas/response/auth.schema";

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
