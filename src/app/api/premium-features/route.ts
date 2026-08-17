import type { APIRouteResponse} from "@/server/boundary";
import { routeSuccess, routeError } from "@/server/boundary";
import { getAllPremiumFeatureService } from "@/services";
import type { PremiumFeaturesResponse } from "@/core/schemas";

export const GET = async (): Promise<
  APIRouteResponse<PremiumFeaturesResponse>
> => {
  try {
    const features = await getAllPremiumFeatureService();

    return routeSuccess({ features: features ?? [] });
  } catch (error) {
    return routeError(error);
  }
};
