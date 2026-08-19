import type { NextRequest } from "next/server";
import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { AppError } from "@/core/domain";
import { requireAuth } from "@/services";
import { signUploadRequest } from "@/adapters/server/cloudinary/sign";
import type { UploadSignature } from "@/adapters/server/cloudinary/sign";

export const POST = async (
  request: NextRequest,
): Promise<APIRouteResponse<UploadSignature>> => {
  try {
    await requireAuth();

    const { folder } = await request.json();

    if (!folder) {
      throw new AppError("VALIDATION", "folder 파라미터가 필요합니다.");
    }

    return routeSuccess(signUploadRequest(folder));
  } catch (error) {
    return routeError(error);
  }
};
