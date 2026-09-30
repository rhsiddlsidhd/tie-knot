# 캐싱과 재검증

> Last updated: 2026-09-29

## 역할

- 공식 문서 내용을 요약하거나 다시 서술하지 않는다. 좌표와 결정만 담는다.
- 좌표는 `node_modules/next/dist/docs/01-app/` 기준 상대 경로다.

## 1. Router

| 하려는 일                                  | 읽을 공식 문서                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 페이지를 요청마다 렌더할지 캐시할지 정한다 | `02-guides/caching-without-cache-components.md`, `03-api-reference/03-file-conventions/02-route-segment-config`                   |
| 정적 페이지를 주기적으로 갱신한다 (ISR)    | `02-guides/incremental-static-regeneration.md`                                                                                    |
| 서버에서 부른 외부 API 응답을 캐시한다     | `03-api-reference/04-functions/fetch.md`, `02-guides/caching-without-cache-components.md` § Caching `fetch` requests              |
| mutation 직후 화면·캐시를 갱신한다         | `02-guides/server-actions.md` § Choosing a cache update, `02-guides/caching-without-cache-components.md` § On-demand revalidation |

## 2. Convention

| 항목             | 결정                                                                                                                                                                                                                                                               | 공식 입장                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 캐싱 모델        | Cache Components 미사용 — `use cache` 0건, `next.config.ts`에 플래그 없음                                                                                                                                                                                          | `01-getting-started/08-caching.md` — 옵트인 기능                                                               |
| 페이지 기본값    | 개인화·인증이 걸린 페이지는 `export const dynamic = "force-dynamic"`(19곳). 공개 랜딩 `revalidate = 600`, 청첩장 preview `revalidate = 300`                                                                                                                        | route segment config — 기본은 요청 시 렌더                                                                     |
| 외부 API 호출    | `src/adapters/server/*`의 `fetch`에 캐시 옵션 미지정 = 매 요청 왕복                                                                                                                                                                                                | `fetch.md` § options.cache — 기본은 캐시 안 함, `force-cache`·`next.revalidate`로 옵트인                       |
| mutation 후 갱신 | Server Action 안에서 `revalidatePath` 호출                                                                                                                                                                                                                         | `server-actions.md` § Choosing a cache update — `updateTag`·`revalidateTag`·`revalidatePath`·`refresh` 중 선택 |
| 클라 목록 갱신   | 클라이언트 SWR로 조회하는 목록(admin 목록)은 mutation 성공 후 해당 SWR `mutate()`로 갱신한다 — 컨테이너가 `onRefreshed`로 행·다이얼로그에 넘긴다. `router.refresh()`로 대신하지 않는다. Server Action의 `revalidatePath`는 RSC로 그리는 페이지 갱신용으로 유지한다 | `server-actions.md` § Choosing a cache update — 클라이언트 캐시는 언급 없음                                    |
