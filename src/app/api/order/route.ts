import type { NextRequest } from "next/server";
import type { APIRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getOrdersPageForUser, requireAuth } from "@/services";
import { orderListRequestSchema } from "@/core/schemas";
import { validateAndFlatten } from "@/core/utils";
import type { OrderListPage } from "@/core/domain";
import { AppError } from "@/core/domain";

/**
 * my-orders 목록의 "더보기" 전용 — 첫 페이지는 Server Component가 서비스를 직접
 * 호출하고(docs/architecture/data-access.md rule 1), 이후 페이지만 브라우저 캐싱이
 * 필요해 이 경로를 탄다(rule 3).
 *
 * 자동취소 lazy-check(cancelExpired*)는 여기서 호출하지 않는다 — PortOne 환불 API를
 * 실제로 부르므로 필터 전환·더보기마다 도는 것을 막아야 한다(첫 진입 RSC에서만 1회).
 */
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<OrderListPage>> => {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(orderListRequestSchema, {
      status: searchParams.get("status"),
      category: searchParams.get("category"),
      cursor: searchParams.get("cursor"),
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }

    const page = await getOrdersPageForUser({ userId, ...parsed.data });

    return routeSuccess(page);
  } catch (error) {
    return routeError(error);
  }
};
