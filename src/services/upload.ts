import "server-only";
import { signUploadRequest } from "@/adapters/server/cloudinary/sign";
import type { UploadSignature } from "@/adapters/server/cloudinary/sign";
import { AppError } from "@/core/domain/error";
import { requireAuth } from "./auth";

/**
 * 업로드 서명 발급 — 서명은 Cloudinary에 파일을 올릴 권한 자체이므로 로그인 확인이
 * 발급의 일부다. 호출자가 인증을 먼저 부르는 것을 잊을 수 있는 자리에 두지 않는다.
 *
 * folder 검사가 인증 뒤에 오는 순서도 유스케이스의 일부다 — 미인증 호출자에게는
 * 요청 본문이 어떻든 401로 답한다.
 */
export async function createUploadSignatureForCurrentUser(
  folder: string | undefined,
  paramsToSign?: Record<string, unknown>,
): Promise<UploadSignature> {
  await requireAuth();

  if (!folder) {
    throw new AppError("VALIDATION", "folder 파라미터가 필요합니다.");
  }

  return signUploadRequest(folder, paramsToSign);
}
