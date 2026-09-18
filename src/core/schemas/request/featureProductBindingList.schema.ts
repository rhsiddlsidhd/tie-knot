import * as z from "zod";
import { SearchTermSchema } from "./productSearch.schema";

// URL searchParams는 "값 없음"을 빈 문자열로도 표현한다(`?q=`, `?cursor=`) — 빈 값은
// 조건 해제와 같은 의미이므로 스키마 진입 전에 undefined로 정규화한다.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

// 검색어 정규화(trim·길이 제한·빈 값 처리)는 고객 검색과 같은 규칙을 쓴다 —
// 목록마다 규칙이 갈리지 않도록 SearchTermSchema를 import해 재사용한다(#309).
const FeatureProductBindingListRequestSchema = z.object({
  q: z.preprocess(emptyToUndefined, SearchTermSchema),
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

type FeatureProductBindingListRequest = z.infer<
  typeof FeatureProductBindingListRequestSchema
>;

export {
  FeatureProductBindingListRequestSchema,
  type FeatureProductBindingListRequest,
};
