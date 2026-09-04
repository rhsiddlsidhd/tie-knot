import * as z from "zod";
import { PRODUCT_CATEGORIES } from "@/core/domain/product-category";

// URL searchParams는 "값 없음"을 빈 문자열로도 표현한다(`?subCategory=`) — 빈 값은
// 필터 해제와 같은 의미이므로 스키마 진입 전에 undefined로 정규화해 서비스가 조건
// 유무만 보게 한다.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const productListRequestSchema = z.object({
  category: z.preprocess(emptyToUndefined, z.enum(PRODUCT_CATEGORIES).optional()),
  // subCategory는 카테고리마다 허용 집합이 달라 여기서 SUB_CATEGORY_MAP까지 교차
  // 검증하지 않는다 — 유효하지 않은 조합은 서비스 쿼리가 그냥 0건으로 떨어뜨린다
  // (orderListRequestSchema와 동일하게 "필터는 URL이 소유, 잘못된 값은 조용히
  // 무시"하는 방침).
  subCategory: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type ProductListRequest = z.infer<typeof productListRequestSchema>;
