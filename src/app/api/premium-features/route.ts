import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
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
