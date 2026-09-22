import type { NextRequest } from "next/server";
import type { ApiRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getOrdersPageForUser } from "@/services/order";
import { requireAuth } from "@/services/auth";
import { OrderListRequestSchema } from "@/core/schemas/request/orderList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import type { OrderListPage } from "@/core/domain/order";
import { AppError } from "@/core/domain/error";

/**
 * my-orders 목록의 "더보기" 전용 — docs/architecture/data-access.md "목록 페이지네이션".
 *
 * 자동취소 lazy-check(cancelExpired*)는 여기서 호출하지 않는다 — PortOne 환불 API를
 * 실제로 부르므로 필터 전환·더보기마다 도는 것을 막아야 한다(첫 진입 RSC에서만 1회).
 */
const GET = async (
  request: NextRequest,
): Promise<ApiRouteResponse<OrderListPage>> => {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(OrderListRequestSchema, {
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

export { GET };
