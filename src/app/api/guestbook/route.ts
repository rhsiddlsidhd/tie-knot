import type { APIRouteResponse} from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import type { GuestbookListPage } from "@/core/domain";
import { AppError } from "@/core/domain";
import { getGuestbookService } from "@/services/guestbook";
import { getAuth } from "@/services/auth";
import type { GuestbookListResponse } from "@/core/schemas";
import type { NextRequest } from "next/server";

// getGuestbookService가 이미 password/__v/updatedAt은 select에서 제외한다 —
// 여기선 응답 계약(GuestbookListResponse)에 맞춰 createdAt만 ISO 문자열로 명시 변환한다.
function toGuestbookListResponse(page: GuestbookListPage): GuestbookListResponse {
  return {
    items: page.items.map(({ id, author, message, isPrivate, createdAt }) => ({
      _id: id,
      author,
      message,
      isPrivate,
      createdAt: new Date(createdAt).toISOString(),
    })),
    nextCursor: page.nextCursor,
  };
}

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<GuestbookListResponse>> => {
  try {
    const publicKey = req.nextUrl.searchParams.get("publicKey");
    if (!publicKey) throw new AppError("VALIDATION", "publicKey가 필요합니다.");
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

    const auth = await getAuth();
    const page = await getGuestbookService(publicKey, {
      cursor,
      viewerUserId: auth?.userId,
    });
    return routeSuccess(toGuestbookListResponse(page));
  } catch (e) {
    return routeError(e);
  }
};
