import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { AppError } from "@/core/domain";
import { getGuestbookService } from "@/services";
import { getAuth } from "@/services";
import type { IGuestbook } from "@/models";
import type { GuestbookListResponse } from "@/core/schemas";
import type { NextRequest } from "next/server";

// getGuestbookService가 이미 password/__v/updatedAt은 select에서 제외한다 —
// 여기선 응답 계약(GuestbookListResponse)에 맞춰 createdAt만 ISO 문자열로 명시 변환한다.
function toGuestbookListResponse(guestbooks: IGuestbook[]): GuestbookListResponse {
  return guestbooks.map(({ _id, author, message, isPrivate, createdAt }) => ({
    _id: _id.toString(),
    author,
    message,
    isPrivate,
    createdAt: new Date(createdAt).toISOString(),
  }));
}

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<GuestbookListResponse>> => {
  try {
    const publicKey = req.nextUrl.searchParams.get("publicKey");
    if (!publicKey) throw new AppError("VALIDATION", "publicKey가 필요합니다.");

    const auth = await getAuth();
    const guestbooks = await getGuestbookService(publicKey, auth?.userId);
    return routeSuccess(toGuestbookListResponse(guestbooks));
  } catch (e) {
    return routeError(e);
  }
};
