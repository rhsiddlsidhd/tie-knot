# ADR-0010: admin 목록의 URL 소유 offset 페이지네이션

- 상태: Accepted
- 결정일: 2026-09-29
- 적용 범위: `src/app/(admin)/admin/*` 목록 페이지, `src/app/api/admin/*` GET, `src/ui/hooks/useOffsetList.ts`, `src/ui/components/organisms/DataTable/`

## 맥락

admin 목록(상품·주문·사용자·리뷰·프리미엄 기능·기능-상품 연결)은 운영자가 특정 페이지로 바로 이동하고, 열 머리글로 정렬하고, 전체 건수를 확인해야 한다. 기존 목록은 공개 목록과 같은 cursor 방식이라 "다음" 이동만 가능했고, 정렬 키가 바뀌면 cursor가 무효가 돼 임의 페이지 이동과 열 정렬을 함께 제공하기 어려웠다.

기존 page.tsx는 서버에서 searchParams를 읽어 service를 호출하고 Template에 결과를 넘겼다. 이 구조에서는 검색·정렬·페이지 조작마다 서버 렌더가 다시 일어나고, 조작 중인 입력 상태와 서버가 돌려준 URL이 어긋나는 경쟁이 생겼다.

공개 상품 목록은 무한 스크롤이라 총 건수나 임의 페이지가 필요 없고, cursor 방식이 대규모 데이터에서 skip 비용 없이 동작한다.

## 결정

admin 목록은 offset(`page`/`limit`, 응답 `OffsetPage`)으로 조회하고, 공개 목록은 cursor 무한 스크롤을 유지한다.

목록 상태(`page`·`q`·`sort`·`direction`·`view`/`status`/`role`)는 URL이 소유한다. `useOffsetList`가 History API로 URL을 바꾸며 페이지 이동은 `pushState`, 검색·정렬·필터는 `replaceState`를 쓴다. 조회는 같은 훅이 SWR로 `GET /api/admin/*`를 호출해 클라이언트에서 수행하고, 초기 렌더도 클라이언트 fetch다. URL에 따라 달라지는 제목·버튼·필터는 클라이언트 컨테이너가 그리며, page.tsx는 searchParams를 읽지 않는다.

```text
page.tsx (서버)  verifySession("ADMIN") → <Container /> (기능-상품 연결만 기능 조회 + notFound)
Container (클라) useOffsetList → URL ↔ History API
                                → SWR → GET /api/admin/* (route: requireAdmin)
                 → ListPage + DataTable(columns · rows · toolbar · pagination)
mutation 성공    → onRefreshed → SWR mutate()
```

인가는 route handler의 `requireAdmin`과 page의 `verifySession`이 각각 맡는다. mutation 후 갱신은 [캐싱과 재검증](../architecture/caching-and-revalidation.md), 흐름은 [서버-클라이언트 데이터 흐름](../architecture/server-client-data-flow.md)을 따른다.

## 검토한 대안

### cursor 유지

공개 목록과 구현을 공유하고 대규모 데이터에서도 skip 비용이 없다. 임의 페이지 이동·총 건수·열 정렬을 함께 제공할 수 없어 admin 요구를 충족하지 못해 기각했다.

### RSC + Link (서버 렌더 목록)

JavaScript 없이도 동작하고 초기 HTML에 데이터가 담긴다. 조작마다 서버 렌더와 네비게이션이 일어나 검색 입력과 URL이 경쟁하고, 로딩 중 이전 결과 유지 같은 표 상태를 표현하기 어려워 기각했다.

### RSC fallbackData + SWR 혼합

초기 렌더는 서버 데이터, 이후는 클라이언트 조회로 첫 화면이 빠르다. page.tsx가 다시 searchParams와 service를 알아야 하고, 서버 key와 클라이언트 key를 같은 정규화로 맞춰야 하는 이중 경로가 생겨 기각했다.

### SWR Suspense 모드

로딩 분기를 Suspense 경계로 옮겨 컴포넌트가 단순해진다. 조작마다 경계 전체가 fallback으로 바뀌어 이전 결과를 보여 주며 갱신하는 동작(`keepPreviousData`)과 맞지 않아 기각했다.

### `router.push`/`router.replace` 네비게이션

Next.js 라우터가 URL과 history를 일관되게 관리한다. 목록 조작마다 서버 컴포넌트 트리를 다시 요청해 클라이언트 조회만으로 충분한 변경에 불필요한 왕복이 생겨 기각했다.

## 결과

얻는 것: 임의 페이지 이동·총 건수·3단 열 정렬(내림차순 → 오름차순 → 해제)을 모든 admin 목록이 같은 `DataTable`·`useOffsetList` 조합으로 제공한다. URL을 공유하거나 새로고침해도 같은 목록이 복원되고, 뒤로 가기는 페이지 이동 단위로 동작한다.

트레이드오프: 초기 렌더에 데이터가 없어 Skeleton이 먼저 보인다. 뒤 페이지로 갈수록 DB의 skip 비용이 커진다. 조회 사이에 행이 추가·삭제되면 페이지 경계가 흔들려 같은 행이 두 페이지에 보이거나 빠질 수 있다.

잔여 위험과 가드: skip 비용은 admin 데이터 규모가 작다는 전제에 기대며, 요청 스키마의 `limit` 상한이 한 번에 읽는 양을 막는다. 범위를 벗어난 page는 `useOffsetList`가 마지막 페이지로 되돌린다. Server Action의 `revalidatePath`는 공개 RSC 페이지 갱신용으로 남아 있으므로 admin 목록 갱신을 그것에 기대지 않는다.

## 관련 이력

- `3de411c` feat(api): add offset page contract and base list schema
- `97e7f70` feat(ui): add useOffsetList hook for url-synced offset lists
- `a0543a9` feat(ui): add generic DataTable organism
