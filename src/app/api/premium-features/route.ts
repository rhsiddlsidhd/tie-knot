import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getAllPremiumFeatureService } from "@/services/premiumFeature";
import type { PremiumFeaturesResponse } from "@/core/schemas/response/premiumFeature.schema";

const GET = async (): Promise<ApiRouteResponse<PremiumFeaturesResponse>> => {
  try {
    const features = await getAllPremiumFeatureService();

    return routeSuccess({ features: features ?? [] });
  } catch (error) {
    return routeError(error);
  }
};

export { GET };
