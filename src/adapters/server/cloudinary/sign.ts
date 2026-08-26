import "server-only";
import { v2 as cloudinary } from "cloudinary";

export type UploadSignature = {
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  cloudName: string | undefined;
  apiKey: string | undefined;
};

export function signUploadRequest(
  folder: string,
  widgetParams?: Record<string, unknown>,
): UploadSignature {
  const timestamp =
    typeof widgetParams?.timestamp === "number"
      ? widgetParams.timestamp
      : Math.round(new Date().getTime() / 1000);
  const paramsToSign = widgetParams ?? {
    timestamp,
    folder,
    allowed_formats: "jpg,png,webp,jpeg",
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    folder,
    allowed_formats: "jpg,png,webp,jpeg",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}
