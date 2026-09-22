# 데이터 접근 경로

> Last updated: 2026-09-22
> `src/AGENTS.md`에서 분리됨.

## 데이터 접근 경로 — 무엇이 필요한가가 기준

"누가 부르는가"가 아니라 "무엇이 필요한가"로 경로가 갈린다 — 브라우저가 트리거해도 mutation은 예외 없이 Server Action으로 간다(아래 2번), route.ts를 거치는 건 캐싱이 필요한 조회뿐이다.

| #   | 필요                                                                       | 경로                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 서버 렌더 시점 데이터(Server Component 렌더링용)                           | `src/services/*` 직접 import + 함수 호출 — route.ts 안 거침(같은 프로세스 안에서 굳이 HTTP 왕복 안 만듦)                                                                                          |
| 2   | 브라우저 트리거 mutation(create/update/delete) — 폼이든 이벤트 핸들러든    | Server Action — 폼 밖이면 이벤트 핸들러/`useEffect`를 `startTransition`으로 감싸 호출. route.ts/raw `fetch` 안 거침(Server Action은 브라우저에 함수 참조만 내려가는 RPC라 route.ts 자체가 불필요) |
| 3   | 브라우저가 캐싱/재검증(dedupe, focus·interval revalidate) 필요한 조회(GET) | route.ts + `fetcher`(`useSWR`) — raw `fetch` 안 거침(envelope 파싱/구조화된 에러 정규화가 `fetcher`에 집중)                                                                                       |

- 브라우저가 트리거하는 mutation은 예외 없이 Server Action(row 2)으로 간다 — 클라이언트에 raw `fetch`(및 그 래퍼)를 두지 않는다. 과거 "caller가 Server Action을 못 쓰는 mutation" 예외(외부 연동 등)는 실제 인스턴스가 없어 제거했다 — 외부 결제도 브라우저 SDK 호출만 클라에 남고 검증 mutation은 Server Action이다. 새로 그런 사례가 실제로 생기면 그때 재검토한다(가정만으로 예외 자리를 미리 열어두지 않는다).

## 목록 페이지네이션 — row 1과 row 3의 조합

이전 페이지가 화면에 누적되는 목록(더보기·무한스크롤)은 첫 페이지와 이후 페이지의 경로가 다르다. 적용 사례: `my-orders`(`OrderList.tsx` + `api/orders/route.ts`), 상품 목록(`ProductCatalog.tsx` + `api/products/route.ts`).

- 첫 페이지는 row 1이다 — `page.tsx`가 service를 직접 호출해 결과를 props로 내린다. 빈 화면에서 시작해 마운트 후 fetch하는 순수 CSR 목록은 만들지 않는다 — 첫 렌더가 늦어지고, 서버가 이미 가진 데이터를 HTTP로 한 번 더 받는 낭비다.
- 이후 페이지만 row 3이다 — route.ts + `fetcher`(`useSWRInfinite`). route.ts는 "더보기" 전용이며 첫 페이지 조회 책임을 갖지 않는다.
- 두 경로는 `fallbackData: [firstPage]` + `revalidateFirstPage: false` + `revalidateOnMount: false`로 잇는다 — 첫 페이지는 방금 Server Component가 조회해 넘겨준 값이라 마운트 시 같은 쿼리를 다시 돌리지 않는다. 갱신이 필요한 시점(취소 등 mutation 직후)에는 `mutate`로 명시적으로 다시 받아온다.
- 서버가 소유한 필터(URL searchParams)는 SWR key에 포함한다 — 필터가 바뀌면 key가 바뀌어 누적분이 자동으로 리셋되고, 클라이언트는 커서 없이 새 쿼리를 처음부터 다시 보낸다. 리셋을 별도 상태로 관리하지 않는다.
- 누적이 필요 없는 목록(관리자 목록처럼 10개씩 교체하고, 특정 페이지의 북마크·공유·뒤로가기 복원이 필요한 화면)은 이 조합을 쓰지 않는다 — row 1만으로 커서를 URL에 실어 `<Link>` 내비게이션으로 넘긴다(`CursorPagination`). 클라이언트 fetch·캐시·만료 처리가 생기지 않고, 인가 진입점이 `page.tsx` 하나로 유지된다.
