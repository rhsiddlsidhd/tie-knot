import type { NextRequest } from "next/server";
import type { APIRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { createUploadSignatureForCurrentUser } from "@/services/upload";
import type { UploadSignature } from "@/adapters/server/cloudinary/sign";
import { AppError } from "@/core/domain/error";

type UploadSignatureRequestBody = {
  folder?: string;
  paramsToSign?: Record<string, unknown>;
};

export const POST = async (
  request: NextRequest,
): Promise<APIRouteResponse<UploadSignature>> => {
  try {
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      throw new AppError(
        "VALIDATION",
        "요청 본문이 올바른 JSON 형식이 아닙니다.",
      );
    }

    if (typeof parsedBody !== "object" || parsedBody === null) {
      throw new AppError(
        "VALIDATION",
        "요청 본문이 올바른 JSON 형식이 아닙니다.",
      );
    }

    const { folder: requestedFolder, paramsToSign } =
      parsedBody as UploadSignatureRequestBody;
    const folder =
      requestedFolder ??
      (typeof paramsToSign?.folder === "string"
        ? paramsToSign.folder
        : undefined);

    return routeSuccess(
      await createUploadSignatureForCurrentUser(folder, paramsToSign),
    );
  } catch (error) {
    return routeError(error);
  }
};
