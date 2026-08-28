import * as z from "zod";
import { REVIEW_SORT_KEYS } from "@/core/domain";

// URL searchParams는 "값 없음"을 빈 문자열로도 표현한다(`?sort=`) — 빈 값은 필터
// 해제와 같은 의미이므로 스키마 진입 전에 undefined로 정규화해 서비스가 조건 유무만 보게 한다.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const productReviewListRequestSchema = z.object({
  sort: z.preprocess(emptyToUndefined, z.enum(REVIEW_SORT_KEYS).optional()),
  reviewCursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type ProductReviewListRequest = z.infer<
  typeof productReviewListRequestSchema
>;
