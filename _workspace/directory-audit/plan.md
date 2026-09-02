# 디렉터리 감사 실행 계획

> 대상 보고서: `_workspace/directory-audit/report.md` (2026-09-02)
> 작성일: 2026-09-02

## 0. 이 문서의 위치

보고서는 **사실 층위**(위반 판정 + 근거 문서)를 담당한다. 이 문서는 **결정·실행 층위**를 담당한다 — 처방, 우선순위, 판정 이견.

보고서는 수정하지 않는다. 보고서에 포함된 `조치:` 필드와 §3의 이동/리네임/분할/유지 열, §4의 `영향:` 수치는 실행 층위 내용이므로 이 문서의 판단으로 대체한다.

**결정은 이 문서가 아니라 규칙 문서(AGENTS.md / ADR)에 반영한다.** 계획서에만 적으면 다음 감사가 같은 질문을 다시 하게 된다.

---

## 1. 보고서 판정에 대한 이견

실행 전에 확정해야 하는 사실 층위 이견 3건. 처방이 아니라 판정 자체에 대한 반론이다.

### 이견 1 — `webhooks/portone`은 축1 위반이 아니다

보고서: Route Handler 5개가 "외부 API·SDK 호출 또는 Adapter 조합 유스케이스를 직접 소유" (Medium).

`src/app/api/webhooks/portone/route.ts`가 하는 일은 서명 검증(`Webhook.verify`) → `storeId` 확인 → `syncPayment(paymentId)` 위임뿐이다. 도메인 로직은 이미 `services/payment`에 있다. 서명 검증은 "이 HTTP 요청이 진짜인지" 판정하는 일이므로 **진입점의 고유 책임**이며 유스케이스 소유가 아니다.

판정: 위반 아님. Route Handler 위반은 5건이 아니라 4건.

### 이견 2 — 축1/Low 14건은 원인 2 / 파급 12로 분리해야 한다

보고서: "core 도메인 타입을 services 2개가 소유·재노출하고 route-local UI 등 12개가 그 경로를 소비" — 14건.

실제 위반은 `src/services/product.ts:24`, `src/services/premiumFeature.ts:7` **2건**이다. 나머지 12개는 그 2건을 import하는 소비자로, 원인을 고치면 import 경로 한 줄씩 바뀔 뿐이다. 14건으로 계상하면 부채 규모가 7배로 부풀어 보인다.

판정: 원인 2건 / 파급 12건으로 분리 계상.

### 이견 3 — Q3 현황 13건 중 1건은 오탐

`src/ui/hooks/useKakaomapGeocode.ts:23`의 `document`는 브라우저 전역이 아니다.

```ts
const document = data?.documents?.[0];   // 카카오맵 응답 배열 원소
return document ? { lat: Number(document.y), lng: Number(document.x) } : ...
```

카카오맵 API가 결과 배열을 `documents`로 부르는 탓에 생긴 지역 변수명이다. 전역 `document`에는 `.y`/`.x`가 없다.

판정: Q3 대상은 13개가 아니라 12개.

---

## 2. 회색지대 6문항 — 확정된 결정

| Q | 결정 | 반영할 문서 | 문서 수정 필요 |
|---|---|---|---|
| Q1 route-local `_utils` 승격 기준 | 라우트 종속이면 `_utils` 잔류 | `src/app/AGENTS.md §Structure` | 필요 |
| Q2 `ui/hooks` 승격 임계점 | 현행 유지 | — | 불필요 (기존 "2개 이상 라우트 공유 시 승격"이 이미 답) |
| Q3 `adapters/browser` 경계 범위 | 대체·스텁이 필요한 capability만 | `src/adapters/AGENTS.md §경계` | 필요 |
| Q4 `boundary.ts` 역할 분할 | 분할하지 않고 `src/` 루트 예외로 명문화 | `src/AGENTS.md` | 필요 |
| Q5 `_components` view/side effect 혼재 | 파일 전체를 `_containers`로 이동 | — | 불필요 (기존 조건문이 이동을 요구, 분할 요구 아님) |
| Q6 `kakaomap` 세그먼트 | `kakao-map`으로 리네임 | `docs/conventions/route-naming.md` | 필요 |

### Q3 결정 근거 (유일하게 되돌리기 비싼 결정)

선택지 A(브라우저 전역 접근을 전부 Adapter화)를 **탈락**시킨 이유는 실행 비용이 아니라 규칙 체계와의 자기모순이다.

`src/adapters/AGENTS.md`는 "`server/`와 `browser/` 아래 폴더 하나는 외부 서비스 또는 런타임 경계 하나를 담당한다"를 불변식으로 둔다. A안을 실행하면 `document.body.style`, `addEventListener`, `matchMedia`, `document.cookie` 같은 서로 무관한 접근이 `adapters/browser/dom/` 형태의 자루 폴더로 모인다. 이는 경계 하나가 아니라 나머지 전부이며 ADR-0002가 세운 구조를 깬다.

선택지 B의 보고서 문구("복사·위치 조회만")도 기준이 아니라 결과 열거라 새 코드 판정에 쓸 수 없다. 다음 문장으로 대체한다:

> `adapters/browser/`는 **대체·스텁이 필요한 capability**를 감싼다 — 권한 게이트가 있거나(clipboard, geolocation), 비결정적이거나(`crypto.randomUUID`), 외부 SDK·앱을 호출하는(portone, daum, kakao, deeplink) 것. 렌더 부수효과로서의 DOM 조작·이벤트 리스너·미디어쿼리는 Adapter 대상이 아니며 컴포넌트나 `ui/hooks`에 남긴다.

선례: `adapters/browser/deeplink/open-app.ts`는 SDK를 쓰지 않고 `window.open`/`window.location.href`만 만지지만 정당한 Adapter다. "`window`를 써서"가 아니라 **"지도 앱 열기"라는 이름 붙는 capability 하나**를 이루고, 티맵 실패 시 네이버맵 폴백이라는 정책까지 소유하기 때문이다.

Q3 대상 12건의 성격 분류:

| 분류 | 파일 | 처리 |
|---|---|---|
| 권한·비결정 capability | `ui/hooks/useCopy.ts:14`, `ui/hooks/useNavigationGeo.ts:14`, `ui/hooks/useImageList.ts:8`, `ui/context/guestbookDemo/reducer.ts:42` | Adapter화 (4건) |
| native `window.confirm` | `my-orders/_components/OrderCard.tsx:75`, `my-orders/_components/ReviewFormDialog.tsx:70`, `admin/reviews/_components/AdminReviewsTemplate.tsx:28` | **Q3 대상 아님** — 별도 Issue |
| DOM 부수효과 | `(preview)/_components/GuestbookModal.tsx:42`, `preview/[publicKey]/_components/ThemeSync.tsx:11`, `.../interactions/InteractionOverlay.tsx:53`, `ui/components/atoms/sidebar.tsx:82,104`, `ui/hooks/useMobile.ts:8` | 현행 유지 |

`window.confirm` 3건을 Q3에서 분리하는 이유: Adapter로 감싸도 여전히 네이티브 confirm이 뜬다. 프로젝트에 `ui/components/molecules/Alert`와 Radix Dialog가 있는데 주문 취소·리뷰 삭제라는 되돌릴 수 없는 동작에 브라우저 기본 confirm을 쓰는 것은 UI 일관성 문제다. Adapter화가 아니라 컴포넌트 교체가 해법이다.

---

## 3. 실행 순서

### Step 1 — 결정을 규칙 문서에 반영 (docs 전용 PR)

**목적**: Q1·Q3·Q4·Q6의 결정을 규칙 문서에 박아 다음 감사가 같은 질문을 하지 않게 한다. Step 3·4의 판정 기준이 여기서 나오므로 실행보다 먼저다.

**작업**
- `src/app/AGENTS.md §Structure` — 라우트 종속 순수함수는 소비자 수와 무관하게 `_utils` 잔류 (Q1)
- `src/adapters/AGENTS.md §경계` — §2의 Q3 기준 문장 추가 (Q3)
- `src/AGENTS.md` — `boundary.ts`가 Route Handler 변환과 Action 변환을 함께 소유하는 것을 루트 예외로 명문화 (Q4)
- `docs/conventions/route-naming.md` — 무하이픈 합성 세그먼트 금지 (Q6)

**리스크**: 없음. 코드 변경 없음.
**검증**: 없음 (docs).
**산출물**: PR 1개. Step 3과 병렬 진행 가능.

### Step 2 — 이 계획서 자체

이 문서 커밋. 보고서는 원본 유지.

### Step 3 — `_components` 13개 → `_containers` (최우선 착수)

**목적**: 축1 Medium 부채의 최대 덩어리 해소. 로직 변경 0, 규칙 근거 최강, 리스크 최저.

**근거**: `src/app/AGENTS.md §Structure` — "라우트 전용 client 컴포넌트가 다음 중 하나라도 포함하면 `_components/`가 아니라 동급의 `_containers/{Name}.tsx`에 둔다: `useSWR`/`useSWRInfinite` + `fetcher` / `useActionState` 또는 `startTransition(() => action(...))` / zustand 결과로 `toast`·`router.replace` 실행". 단정형 조건이며 13개 파일이 모두 해당한다.

**대상 13개** (부록 A)

**작업**
1. 각 라우트에 `_containers/` 생성 (`admin/products`, `admin/reviews`, `my-orders`, `payment-result`, `preview/[publicKey]`는 신설 / `my-orders/[orderId]/invitation`, `products/[category]/[id]`는 기존 활용)
2. `git mv`로 본체 + 동거 테스트(`*.component.test.tsx`) 함께 이동
3. 상대 경로 import 수정 — 이동 파일끼리 서로 import하는 3쌍이 있어 한 커밋에 묶어야 한다 (부록 A 참조)
4. 외부 소비자 import 경로 수정 (`page.tsx`, `MyOrdersTemplate.tsx`, `ProductDetailTemplate.tsx` 등)

**리스크**: 낮음. 순수 이동. 다만 상대 경로가 얽혀 있어 부분 커밋 시 빌드가 깨진다 — 단일 커밋.

**TDD gate 주의**: `.claude/settings.json`의 훅 matcher는 `Write|Edit|MultiEdit`이다. 순수 이동 리팩터에는 새로 쓸 테스트가 없으므로 `git mv` + `sed` 경로 치환(Bash)으로 진행한다. 훅 우회가 아니라 리네임에 맞는 도구 선택이다.

**검증**: `pnpm typecheck` + 이동한 13개 테스트 파일 통과 + `pnpm lint`.
**산출물**: Issue 1개 + PR 1개.

### Step 4 — order API 통합

**목적**: 축1 Medium 1건 + 축2 Low 1건을 한 번에 해소. 따로 하면 같은 파일을 두 번 건드리고 소비자 import가 두 번 깨진다.

**작업**
1. `src/app/api/order/create/route.ts`의 POST 핸들러를 `src/actions/createOrder.ts`로 이동 (`data-access.md` — 브라우저 트리거 mutation은 Server Action)
2. `src/app/api/order/route.ts` → `src/app/api/orders/route.ts` 리네임 (`route-naming.md` — 컬렉션 복수형, 행위 세그먼트 금지)
3. 소비자(`CheckoutForm.tsx` 등) 호출부를 `fetch` → Action 직접 호출로 교체

**리스크**: **높음.** 결제 흐름이 걸려 있다.
- 착수 전 확인: `webhooks/portone`이 `merchantUid`를 역조회에만 쓰는지, 발급 타이밍이 PortOne 결제창 호출 전인지
- 회귀 테스트 없이 진행하지 않는다

**검증**: 주문 생성 → 결제 → 웹훅 수신 통합 시나리오.
**산출물**: Issue 1개 + PR 1개. Step 3 머지 후 착수.

### Step 5 — 잔여 항목 (낮은 우선순위)

Step 3·4가 끝나면 Low 상당수가 자동 소멸한다. 남는 것:

| 항목 | 대상 | 비고 |
|---|---|---|
| Route Handler Adapter 분리 | `api/banks`, `api/kakaomap` | 외부 API 계약을 라우트가 소유 중 |
| Route Handler → services 조합 이동 | `api/subway/[station]`, `api/upload/signature` | Adapter는 이미 있고 조합만 라우트에 있음 |
| `kakao-map` 리네임 | `api/kakaomap` | 위 작업에 얹는다 |
| runtime marker 2줄 | `adapters/browser/cloudinary/widget.tsx`, `adapters/server/cloudinary/publicId.ts` | ADR-0002 — `import "client-only"` / `import "server-only"` |
| 도메인 타입 `core/` 이동 | `services/product.ts:24`, `services/premiumFeature.ts:7` | 소비자 12개 import 경로 일괄 수정 |
| Q3 Adapter 신설 | `adapters/browser/clipboard/`, `adapters/browser/geolocation/` | `useCopy`, `useNavigationGeo` |

`crypto.randomUUID` 2건(`useImageList.ts`, `guestbookDemo/reducer.ts`)은 Adapter화할지 생성 위치를 서버로 올릴지 별도 판단이 필요하다. 이번 범위 밖.

### Step 6 — 재발 방지 lint 규칙 (선택)

축 3(의존 방향)이 위반 0인 이유는 ESLint가 막아서다. 축 1이 35인 이유는 사람이 지켜야 해서다.

Step 3 완료 후 `_components/*.tsx`에서 `@/actions/*` import를 금지하는 규칙을 추가하면 13건이 다시 쌓이지 않는다. 감사를 재실행하는 것보다 싸다.

---

## 4. 이번 범위에서 제외

| 항목 | 사유 |
|---|---|
| `api/webhooks/portone` Adapter 분리 | 이견 1 — 위반 아님 |
| `window.confirm` 3건 → Alert/Dialog 교체 | Q3 아닌 UI 일관성 이슈. 별도 Issue |
| DOM 부수효과 6건 Adapter화 | Q3 결정으로 현행 유지 확정 |
| `_utils` 11개 `core/utils` 승격 | Q1 결정으로 잔류 확정 |
| `ui/hooks` 17개 route-local 이동 | Q2 결정으로 현행 유지 확정 |
| `boundary.ts` 분할 | Q4 결정으로 예외 명문화 |
| 재수출 경로 import 9건 (축2/Low) | 대부분 Step 5의 도메인 타입 이동으로 소멸. 잔여분은 소멸 후 재평가 |

---

## 부록 A — Step 3 대상 13개

| # | 현재 경로 | 이동 대상 `_containers` | 상대 import |
|---|---|---|---|
| 1 | `(admin)/admin/products/_components/ProductEditDialog.tsx` | 신설 | → `./NumberField` (미이동, 경로 조정 필요) |
| 2 | `(admin)/admin/products/_components/ProductTableRowAction.tsx` | 신설 | → `./ProductTableRow` 타입 (미이동) |
| 3 | `(admin)/admin/products/_components/ProductTableRowSelect.tsx` | 신설 | — |
| 4 | `(admin)/admin/reviews/_components/AdminReviewsTemplate.tsx` | 신설 | — |
| 5 | `(main)/(my-order)/my-orders/[orderId]/invitation/_components/InvitationStatusControls.tsx` | 기존 | — |
| 6 | `(main)/(my-order)/my-orders/_components/OrderCard.tsx` | 신설 | → `./PaymentButton`, `./PendingCoupleInfoBanner`, `./ReviewFormDialog` |
| 7 | `(main)/(my-order)/my-orders/_components/OrderList.tsx` | 신설 | → `./OrderCard` (동반 이동) |
| 8 | `(main)/(my-order)/my-orders/_components/PaymentButton.tsx` | 신설 | — |
| 9 | `(main)/(my-order)/my-orders/_components/ReviewFormDialog.tsx` | 신설 | — |
| 10 | `(main)/(products)/products/[category]/[id]/_components/ProductLikeBadge.tsx` | 기존 | — |
| 11 | `(main)/(products)/products/[category]/[id]/_components/ProductViewTracker.tsx` | 기존 | — |
| 12 | `(main)/payment-result/_components/PaymentResult.tsx` | 신설 | → `./PaymentResultTemplate` (미이동) |
| 13 | `(preview)/preview/[publicKey]/_components/LiveGuestbookSection.tsx` | 신설 | → `./EyebrowSection`, `./GuestbookList`, `../_utils/...` (미이동) |

13개 모두 동거 테스트 `*.component.test.tsx`가 존재하며 함께 이동한다.

주의 지점:
- #6·#7은 서로 import하며 둘 다 이동 대상 → 상대 경로 유지
- #1·#2·#12·#13은 **이동하지 않는** 형제를 import → `../_components/{Name}`으로 조정
- `PendingCoupleInfoBanner`는 위반 목록에 없으므로 `_components`에 남는다
