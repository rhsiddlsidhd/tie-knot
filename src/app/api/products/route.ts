import type { NextRequest } from "next/server";
import type { APIRouteResponse } from "@/boundary";
import { routeSuccess, routeError } from "@/boundary";
import { getPublicProductsPageService } from "@/services/product";
import { productListRequestSchema } from "@/core/schemas/request/productList.schema";
import { validateAndFlatten } from "@/core/utils/validate-and-flatten";
import { AppError } from "@/core/domain/error";
import type { PublicProductListPage } from "@/core/domain/product";

/**
 * 상품 목록의 "더보기" 전용 — 첫 페이지는 Server Component(page.tsx)가 서비스를
 * 직접 호출하고(docs/architecture/data-access.md rule 1), 이후 페이지만 브라우저
 * 캐싱이 필요해 이 경로를 탄다(rule 3). category/subCategory가 바뀌면 클라이언트가
 * 커서 없이 새 쿼리를 처음부터 다시 보낸다.
 */
export const GET = async (
  request: NextRequest,
): Promise<APIRouteResponse<PublicProductListPage>> => {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = validateAndFlatten(productListRequestSchema, {
      category: searchParams.get("category"),
      subCategory: searchParams.get("subCategory"),
      cursor: searchParams.get("cursor"),
    });

    if (!parsed.success) {
      throw new AppError("VALIDATION", "요청 값을 확인해주세요.", parsed.error);
    }

    const page = await getPublicProductsPageService(parsed.data);

    return routeSuccess(page);
  } catch (error) {
    return routeError(error);
  }
};
