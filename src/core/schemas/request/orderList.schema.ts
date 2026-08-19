import * as z from "zod";
import { ORDER_STATUSES, PRODUCT_CATEGORIES } from "@/core/domain";

// URL searchParams는 "값 없음"을 빈 문자열로도 표현한다(`?status=`) — 빈 값은 필터 해제와
// 같은 의미이므로 스키마 진입 전에 undefined로 정규화해 서비스가 조건 유무만 보게 한다.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const orderListRequestSchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(ORDER_STATUSES).optional()),
  category: z.preprocess(
    emptyToUndefined,
    z.enum(PRODUCT_CATEGORIES).optional(),
  ),
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type OrderListRequest = z.infer<typeof orderListRequestSchema>;
