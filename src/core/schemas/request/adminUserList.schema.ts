import * as z from "zod";
import { USER_ROLES } from "@/core/domain/user";
import { SearchTermSchema } from "./productSearch.schema";

// URL searchParams는 "값 없음"을 빈 문자열로도 표현한다(`?role=`) — 빈 값은 필터
// 해제와 같은 의미이므로 스키마 진입 전에 undefined로 정규화해 서비스가 조건 유무만 보게 한다.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const AdminUserListRequestSchema = z.object({
  // 검색어 정규화(trim·길이 제한·빈 값 처리)는 목록마다 갈리면 안 된다 — 공용
  // SearchTermSchema를 import해 쓴다(#309).
  q: z.preprocess(emptyToUndefined, SearchTermSchema),
  role: z.preprocess(emptyToUndefined, z.enum(USER_ROLES).optional()),
  cursor: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

type AdminUserListRequest = z.infer<typeof AdminUserListRequestSchema>;

export { AdminUserListRequestSchema, type AdminUserListRequest };
