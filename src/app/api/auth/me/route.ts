import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAuth } from "@/services/auth";
import type { AuthSessionResponse } from "@/core/schemas/response/auth.schema";

const GET = async (): Promise<ApiRouteResponse<AuthSessionResponse>> => {
  try {
    const session = await getAuth();
    return routeSuccess(session);
  } catch (e) {
    return routeError(e);
  }
};

export { GET };
