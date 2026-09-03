import type { NextRequest } from "next/server";
import type { APIRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { createUploadSignatureForCurrentUser } from "@/services/upload";
import type { UploadSignature } from "@/adapters/server/cloudinary/sign";

export const POST = async (
  request: NextRequest,
): Promise<APIRouteResponse<UploadSignature>> => {
  try {
    const { folder: requestedFolder, paramsToSign } = await request.json();

    return routeSuccess(
      await createUploadSignatureForCurrentUser(
        requestedFolder ?? paramsToSign?.folder,
        paramsToSign,
      ),
    );
  } catch (error) {
    return routeError(error);
  }
};
