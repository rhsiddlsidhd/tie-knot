import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "@/core/domain/error";

// sign.ts는 API secret을 요청마다 직접 인자로 넘겨 서명하므로 전역 config 없이도
// 동작하지만, uploader.destroy()는 SDK 전역 config(cloud_name/api_key/api_secret)에
// 의존한다 — CLOUDINARY_URL 형태의 단일 env var를 안 쓰는 이 프로젝트 구성상 명시
// config 없이는 "Must supply api_key"로 실패한다(#135에서 실사용 중 발견).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteProductAsset(publicId: string): Promise<void> {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
  if (!result || !["ok", "not found"].includes(result.result)) {
    throw new AppError("EXTERNAL_SERVICE", `이미지 정리에 실패했습니다: ${publicId}`);
  }
}
