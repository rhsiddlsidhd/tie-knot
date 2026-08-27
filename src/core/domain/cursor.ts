// 커서 기반 목록 조회가 공유하는 도메인 무관 계약 — 개별 목록(주문/사용자 등)의
// 필터·DTO는 각자 소유하고, 이 파일은 "페이지 하나의 모양"과 "페이지 크기 상한"만 다룬다.
export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
