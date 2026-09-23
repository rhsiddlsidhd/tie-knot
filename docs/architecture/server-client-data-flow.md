# 서버-클라이언트 데이터 흐름

> Last updated: 2026-09-23

## 역할

- 공식 문서 내용을 요약하거나 다시 서술하지 않는다. 좌표와 결정만 담는다.
- 좌표는 `node_modules/next/dist/docs/01-app/` 기준 상대 경로다. 번들에 목차가 없어 `AGENTS.md`의 "read the relevant guide"만으로는 파일이 특정되지 않는다.

## 1. Router

| 하려는 일                                                                    | 읽을 공식 문서                                                                                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 서버·클라 어디서 돌아야 하는지 판단                                          | `01-getting-started/05-server-and-client-components.md` § When to use                                                                                                 |
| 서버에서 읽어 화면에 뿌린다                                                  | `01-getting-started/06-fetching-data.md`                                                                                                                              |
| 서버에서 읽은 값을 Client Component로 넘긴다 (props·`children` 슬롯·promise) | `01-getting-started/05-server-and-client-components.md` § Passing data, § Interleaving / `01-getting-started/06-fetching-data.md` § Streaming data with the `use` API |
| 브라우저 동작으로 데이터를 바꾼다                                            | `01-getting-started/07-mutating-data.md` → `02-guides/server-actions.md`                                                                                              |
| 폼으로 제출한다 (인자 전달·pending·프로그래매틱 제출)                        | `02-guides/forms.md`                                                                                                                                                  |
| 공개 URL이 필요하다 (외부 진입·프록시·비UI 응답)                             | `02-guides/backend-for-frontend.md`, `01-getting-started/15-route-handlers.md`                                                                                        |
| 시크릿·인가가 조회에 얽힌다                                                  | `02-guides/data-security.md`                                                                                                                                          |

## 2. Convention

| 항목               | 결정                                                                                                                                            | 공식 입장                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 서버 데이터 접근   | `src/services/*` 단일 계층 — DB(`@/models`·`dbConnect`·`mongoose`)와 외부 API(`adapters/server/*`)의 접근 지점은 여기뿐                         | `data-security.md` § Data fetching approaches — HTTP APIs·DAL·Component-Level 3택1, 섞지 말라 |
| 클라 조회          | SWR. 서버가 진실인 데이터는 SWR 캐시에만 두고 Zustand·Context로 복사하지 않는다                                                                 | `06-fetching-data.md` § Client Components — `use` API·React Query도 허용                      |
| 클라 HTTP 호출     | `src/ui/fetcher.ts`만 — 시그니처가 `(url) => Promise<T>`라 GET 전용. envelope을 벗겨 `data`를 반환하고 실패 시 서버가 준 `ErrorPayload`를 throw | 언급 없음                                                                                     |
| mutation 채널      | `src/actions/*` Server Action 전용. `"use server"`는 여기에만 둔다. route.ts는 GET만 — POST·PUT·PATCH·DELETE 없음                               | `backend-for-frontend.md` § Manipulating data — route.ts mutation도 허용                      |
| Server Action 호출 | 폼은 `useActionState`. 폼 밖(이벤트 핸들러·`useEffect`)은 `useTransition`으로 감싼다 — 직접 `await` 금지                                        | `07-mutating-data.md` § Event Handlers — 직접 `await`도 허용                                  |

## 3. 예외

Convention을 어기는 코드는 여기에만 있다. 새 예외는 코드보다 이 표를 먼저 고친다.

| 코드                                                                        | 어기는 규칙                          | 사유                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/adapters/browser/cloudinary/widget.tsx` → `POST /api/upload/signature` | 클라 raw `fetch` 금지, mutation 채널 | Cloudinary 위젯 SDK 콜백 안이라 Server Action을 쓸 수 없다                                                                   |
| `src/app/api/webhooks/portone/route.ts` (POST)                              | mutation 채널                        | PortOne 서버가 호출하는 외부 진입점                                                                                          |
| `src/app/api/cron/expired-orders/route.ts` (GET)                            | mutation 채널                        | Vercel Cron이 GET으로만 호출한다                                                                                             |
| `src/adapters/server/nodemailer/send.ts`                                    | `"use server"` 위치                  | 액션이 아니라 이메일 전송 어댑터인데 `"use server"`가 붙어 있다. `server-only`와 같이 선언돼 있어 의도 불명 — 제거 검토 대상 |

프록시 GET(`api/banks`, `api/kakao-map`, `api/subway`, `api/subway/[station]`)은 예외가 아니다 — `backend-for-frontend.md`의 프록시 용도 그대로다.
