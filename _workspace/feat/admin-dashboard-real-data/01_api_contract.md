# 01 — API 계약 (admin 대시보드 실데이터)

> 작성: api-designer / Phase 1
> 대상 요구사항: `00_requirements.json` (REQ-1, REQ-2)
> 협의 상대: ui-designer, db-migrator (3자 합의 완료 — §8 참고)

---

## 1. 채널 판정 — REST 엔드포인트를 만들지 않는다

**결론: Server Component가 서비스 함수를 직접 `await` 한다. route handler·Server Action·useSWR 전부 없음.**

근거는 `docs/architecture/data-access.md`의 판정표 row 1을 그대로 적용한 것이다.

| 필요 | 경로 |
|---|---|
| 서버 렌더 시점 데이터(Server Component 렌더링용) | `src/services/*` 직접 import + 함수 호출 — route.ts 안 거침 |

대시보드는 (a) 읽기 전용이라 mutation(row 2)이 아니고, (b) 브라우저 캐싱/재검증이 필요 없어 route.ts + `useSWR`(row 3)도 아니다. 이미 `export const dynamic = "force-dynamic"`인 async Server Component라 매 요청 서버에서 렌더된다.

따라서 **이 문서가 정의하는 "API 계약"은 HTTP 요청/응답 shape이 아니라 서비스 함수의 시그니처와 리턴 타입이다.**

### 이것이 경계면 검증에 갖는 의미 (boundary-verifier 필독)

- **`{ success, data }` envelope이 이 경로에는 존재하지 않는다.** `SuccessResponse`/`ErrorResponse`/`ErrorPayload`는 채널 A(Server Action)/채널 B(route.ts) 전용이다. `src/boundary.ts`의 `routeSuccess`/`actionError`/`toErrorPayload`는 이 기능에서 **한 번도 호출되지 않는다.** 서비스는 도메인 타입을 그대로 리턴한다.
- **JSON 직렬화 경계가 없다.** 그래서 `Date`가 `Date`로 살아서 UI까지 간다(§3 참고).
- 새 zod 스키마를 만들지 않는다. `src/core/schemas/request/`·`response/`에 추가할 파일 **없음** — 입력 파라미터가 없고, 출력은 내부 함수 리턴이라 런타임 검증 대상이 아니다.

---

## 2. 지표 재확정 — `00_requirements.json`의 open question 4개에 대한 답

초안(`src/services/dashboard.ts`)을 원점에서 재검토했다. 결과: **4개 카드 구성은 유지, 단 "주문" 카드의 정의가 바뀐다.**

### Q1. 상품/매출/주문/회원 4개가 맞는 지표인가 → **맞다, 유지**

admin 사이드바 섹션이 products / orders / users / premium-features / settings다. 4개 카드 중 3개(상품·주문·회원)가 실제 관리 섹션과 1:1로 대응해서, 대시보드가 각 섹션으로 들어가는 자연스러운 허브가 된다. 5번째 카드(예: 미처리 주문, 취소/환불)는 **추가하지 않는다** — 지금 관리자가 그 숫자를 보고 취할 수 있는 행동이 정의돼 있지 않다(PENDING 주문은 cron이 24시간 뒤 자동취소하고, 청첩장 미입력 건도 cron이 7일 뒤 자동취소+환불한다. 사람이 개입할 지점이 아직 없다).

### Q2. 매출 기준이 CONFIRMED/COMPLETED가 맞는가 → **맞다. 단 기준 시각을 `createdAt` → `confirmedAt`으로 바꾼다**

**상태 필터(유지):**
- `PENDING` 제외 — 결제창만 띄우고 이탈한 주문. 24시간 뒤 cron이 자동취소한다.
- `CANCELLED` 제외 — 취소/환불 완료. 프로젝트에 부분취소가 없어서(db-migrator 실측 확인) 환불 건은 항상 통째로 `CANCELLED`로 전이된다 → 상태 필터만으로 정확히 걸러진다.
- `CONFIRMED` + `COMPLETED` 포함 — 둘 다 "결제가 이미 반영된" 상태다. `src/services/payment.ts:60`의 `isPaymentAppliedStatus`가 정확히 이 두 값을 같은 의미로 정의하고 있다.

**두 상태가 왕복한다는 점이 중요하다:** `src/services/invitation.ts:216`이 청첩장 발행/비공개 토글에 따라 주문을 `COMPLETED` ↔ `CONFIRMED`로 되돌린다. 즉 이 둘은 결제 사실의 두 얼굴이지 진행 단계가 아니다. 한쪽만 세면 관리자가 청첩장을 비공개로 돌릴 때마다 매출이 출렁인다.

**기준 시각 변경 (초안 대비 변경점):**

`createdAt`(주문 행 생성 = 결제창 진입)이 아니라 `confirmedAt`(실제 결제 완료 시각, `payment.ts:364`에서 1회만 세팅)을 쓴다.

1. **가상계좌**는 주문 생성월과 실제 입금월이 갈릴 수 있다. `createdAt` 기준이면 "이번 달 매출"이 실제 입금과 어긋난다.
2. 월말/월초 경계에서 오분류된다 — 7/31 23:50에 시작해 8/1 00:05에 결제된 주문은 8월 매출이다.
3. `confirmedAt`은 `CONFIRMED` 전이 시 한 번만 세팅되고 위의 `COMPLETED` ↔ `CONFIRMED` 토글에 영향받지 않는다 → 토글에도 안정적이다.
4. `orderSchema.index({ orderStatus: 1, confirmedAt: 1 })`가 이미 존재한다 → 이 조합만 인덱스로 완전 커버된다.

### Q3. 최근 활동을 최근 주문으로 채우는 게 맞는가 → **맞다. 통합 액티비티 피드는 만들지 않는다** (3자 합의)

"신규 가입 / 신규 상품"을 섞은 통합 피드를 거부한 이유:

- **"신규 상품 등록"은 관리자 본인이 방금 한 행동이다.** 자기가 한 일을 자기에게 다시 보여주는 것이라 정보량이 0에 수렴한다.
- 이종 엔티티를 섞으려면 판별 유니온 타입 + 컬렉션 3개 조회 + JS에서 merge/정렬이 필요하고, 행 타입마다 별도 UI가 필요하다. 지표 가치 대비 비용이 안 맞는다.
- 주문만이 (a) 고객이 발생시킨 이벤트이고, (b) 금액을 수반하며, (c) 관리자가 반응해야 할 수 있는 사건이다.

**단, 카드 제목은 "최근 활동" → "최근 주문"으로 바꾸는 것을 권고한다** — 주문 목록만 그리면서 제목만 일반적인 "활동"으로 두면, 나중에 읽는 사람이 "다른 활동은 왜 안 보이지"라고 오해한다. 최종 결정은 ui-designer 소관.

**미래의 통합 피드를 위한 자리를 지금 미리 만들지 않는다** — `src/models/AGENTS.md`가 명시하는 원칙("가정만으로 미리 켜지 않는다", "과설계 방지")을 따른다.

**상태 필터 없음(초안 유지):** 최근 주문 5건은 `orderStatus` 필터 없이 `createdAt` desc로 뽑는다. PENDING(방금 들어옴)과 CANCELLED(방금 취소됨) 둘 다 관리자가 볼 가치가 있고, 상태는 배지가 말해준다. 필터를 걸면 오히려 "취소가 발생한 사실"이 숨는다.

### Q4. trend가 필요한 카드는 어디까지인가 → **4개 전부. 단 종류가 두 가지다**

카드마다 trend 종류가 다른 건 일관성 결여가 아니라 **지표의 성격이 실제로 두 종류**이기 때문이다:

| 종류 | 카드 | value | trend | 이유 |
|---|---|---|---|---|
| **저량(stock)** | 총 상품, 총 회원 | 누적 총계 | 이번 달 증가 **절대 건수** | 누적 총계에 전월 대비 %를 씌우면 항상 작은 양수가 나와 변별력이 없다 |
| **유량(flow)** | 매출, 결제 주문 | 이번 달 발생량 | 전월 대비 **%** | value 자체가 이미 한 달치 양이라 비율 비교가 성립한다 |

그래서 리턴 타입의 필드가 카드마다 비대칭인 것이 **의도된 설계**다(ui-designer 확인 완료).

기존 mock의 주문 trend `"+8 지난 주 대비"`는 혼자만 주 단위였다 — **계승하지 않는다.** 전부 월 단위로 통일한다.

---

## 3. 타입 계약 — `src/core/domain/dashboard.ts`

```ts
import type { OrderStatus } from "./order";

/** 대시보드 "최근 주문" 한 행 — 화면이 실제로 그리는 필드만 추린다. */
export interface DashboardRecentOrder {
  /** 행 key 겸 관리자에게 보이는 주문 식별자. Order 컬렉션에서 unique다. */
  merchantUid: string;
  buyerName: string;
  /** DB의 product.title(주문 시점 스냅샷)을 평탄화한 것. */
  productTitle: string;
  /** 원 단위 raw number — 통화 포맷은 UI가 한다. */
  finalPrice: number;
  /** raw enum — 라벨/배지는 ORDER_STATUS_LABELS / ORDER_STATUS_BADGE_VARIANTS 재사용. */
  orderStatus: OrderStatus;
  /** JSON 경계를 안 타므로 Date 그대로 UI까지 간다(string 아님). */
  createdAt: Date;
}

export interface DashboardStats {
  // ── 저량(stock) 지표 ────────────────────────────────
  /** 소프트 삭제되지 않은 전체 상품 수(deletedAt: null). */
  totalProducts: number;
  /** 이번 달(KST) 등록된 상품 수. */
  productsCreatedThisMonth: number;
  /** 탈퇴하지 않은 전체 회원 수(isDelete: false). */
  totalUsers: number;
  /** 이번 달(KST) 가입한 회원 수. */
  usersCreatedThisMonth: number;

  // ── 유량(flow) 지표 ─────────────────────────────────
  //    아래 4개는 모집단이 동일하다: orderStatus ∈ {CONFIRMED, COMPLETED}, confirmedAt 기준.
  //    그래서 revenueThisMonth / paidOrderCountThisMonth = 평균 객단가가 성립한다.
  /** 이번 달(KST) 결제 완료 매출 합계(원). */
  revenueThisMonth: number;
  /** 전월(KST) 결제 완료 매출 합계(원). 0이면 "전월 실적 없음"이다(§6 참고). */
  revenuePreviousMonth: number;
  /** 이번 달(KST) 결제 완료 주문 건수. */
  paidOrderCountThisMonth: number;
  /** 전월(KST) 결제 완료 주문 건수. */
  paidOrderCountPreviousMonth: number;

  // ── 최근 주문 ───────────────────────────────────────
  /** createdAt desc 최대 5건. 상태 필터 없음. 주문이 없으면 빈 배열(REQ-2 빈 상태). */
  recentOrders: DashboardRecentOrder[];
}
```

### 계약상 보장 (UI가 의존해도 되는 것)

- **모든 수치 필드는 항상 실제 `number`다. `null`/`undefined`가 절대 오지 않는다.** 집계 결과가 없으면 `0`이다.
- **`0`은 언제나 "진짜 0"이다.** "집계 실패해서 값을 모름" 상태는 존재하지 않는다 — 집계 실패는 값이 아니라 throw로 나간다(§6). 그래서 UI는 `revenuePreviousMonth === 0` 하나만 보고 "전월 실적 없음 → trend 줄 생략"을 판정할 수 있고, 별도 sentinel 분기가 필요 없다.
- **`recentOrders`는 항상 배열이다.** 주문이 없으면 `[]` (길이 0). `null`이 아니다.
- **완성된 표시 문자열을 절대 내려보내지 않는다.** `"+12.5% 지난 달 대비"` 같은 문구, 통화 포맷(`"₩1,234,000"`), 상대시간(`"3시간 전"`)은 전부 UI 소관이다. 서버가 문구를 만들면 UI가 증감 부호에 따른 색상(증가=primary / 감소=destructive / 동일=muted)을 판단할 수 없다.

### 상수 승격 (초안 대비 변경점)

초안은 `src/services/dashboard.ts` 안에 `REVENUE_STATUSES`를 지역 선언했다. 이걸 **`src/core/domain/order.ts`로 `PAID_ORDER_STATUSES`로 승격**한다:

```ts
/** 결제가 이미 반영된 주문 상태 — 매출/결제주문 집계의 모집단이다.
 *  services/payment.ts의 isPaymentAppliedStatus와 같은 정의를 공유한다. */
export const PAID_ORDER_STATUSES = ["CONFIRMED", "COMPLETED"] as const;
```

이유: "결제로 인정하는 상태가 무엇인가"는 매출 정의의 핵심인데, 지금 이 정의가 `payment.ts:60`(`isPaymentAppliedStatus`)과 `invitation.ts:62`에 이미 각각 흩어져 있다. dashboard가 세 번째 사본을 만들면 나중에 상태가 하나 추가될 때 매출만 조용히 틀려진다. 값이 끝까지 문자열 리터럴이라 `src/AGENTS.md`의 SCREAMING_SNAKE_CASE 규칙에 맞다.

> 기존 `isPaymentAppliedStatus`를 이 상수 기반으로 리팩터링할지는 **이번 스코프 밖**으로 둔다(결제 경로 회귀 위험 대비 이득이 작다). 새 사본을 안 만드는 것까지가 이번 범위다.

### 순수 함수 배치

- **전월 대비 증감률 계산은 UI가 소유한다.** ui-designer가 `src/core/utils/`에 순수함수로 작성한다. 서비스는 원시값 양쪽(`revenueThisMonth`, `revenuePreviousMonth`)만 준다.
- **월 경계 계산은 `src/core/utils/date.ts`에 둔다** (§5 참고). 도메인 무관 날짜 연산이라 `{목적}` 기반 파일 규칙에 맞고, 서비스와 분리돼야 단위 테스트가 가능하다.

---

## 4. 서비스 함수 시그니처 — `src/services/dashboard.ts`

```ts
export const getDashboardStatsService = (): Promise<DashboardStats>;
```

| 항목 | 확정 |
|---|---|
| 파라미터 | **없음.** 필터/기간 선택 UI가 없다. 기간을 인자로 받는 형태는 소비처가 없으므로 만들지 않는다 |
| 리턴 | `Promise<DashboardStats>` — 도메인 타입 그대로, envelope 없음 |
| 호출자 | `src/app/(admin)/admin/dashboard/page.tsx` (Server Component) 단 하나 |
| 인증 | **함수 내부에서 하지 않는다** (§7) |
| 응답 방식 | **즉시 응답(동기적 await).** 비동기 잡·폴링·백그라운드 집계 없음 |
| 캐싱 | **없음.** 페이지가 `dynamic = "force-dynamic"`이라 매 요청 재집계한다. `unstable_cache`를 붙이지 않는다 — REQ-1의 수용 기준이 "상품/회원 등록·주문 발생 시 값이 갱신된다"이다 |
| 실패 | `AppError` throw (§6) |

호출 형태:

```tsx
// page.tsx
await verifySession("ADMIN");
const stats = await getDashboardStatsService();
return <AdminDashboardTemplate stats={stats} />;
```

---

## 5. 필드별 계산 로직 (집계 쿼리 방향)

### 5.1 월 경계는 KST로 계산한다 — 초안 대비 변경점 (중요)

초안은 `new Date(now.getFullYear(), now.getMonth(), 1)`을 썼다. 이건 **서버 로컬 타임존**을 쓴다. Vercel 서버 TZ는 UTC이고, 이 프로젝트에 TZ를 고정하는 설정이 없다(`next.config`/`vercel.json` 확인함). 따라서 "이번 달"이 UTC 월 경계가 되어 KST와 9시간 어긋난다 — **9/1 오전 1시(KST)에 입금된 건이 8월 매출로 잡힌다.** 한국 대상 서비스에서 이건 "대시보드 숫자가 주문 목록과 안 맞는다"는 버그로 직결된다.

`date-fns` v4 + `date-fns-tz` v3이 이미 설치돼 있고, `preview` 페이지가 `formatInTimeZone`으로 `"Asia/Seoul"`을 쓰는 선례가 있다.

`src/core/utils/date.ts`에 추가할 순수함수:

```ts
/** 주어진 시각이 속한 KST 기준 전월·이번 달·다음 달 경계를 UTC instant로 돌려준다. */
export const getKstMonthRange = (now: Date = new Date()) => {
  const zoned = toZonedTime(now, "Asia/Seoul");
  return {
    startOfLastMonth: fromZonedTime(startOfMonth(subMonths(zoned, 1)), "Asia/Seoul"),
    startOfThisMonth: fromZonedTime(startOfMonth(zoned), "Asia/Seoul"),
    startOfNextMonth: fromZonedTime(startOfMonth(addMonths(zoned, 1)), "Asia/Seoul"),
  };
};
```

`date-fns-tz`는 isomorphic이라 `src/core/`의 "서버 전용 패키지 금지" 경계를 위반하지 않는다.

**상한은 `now`가 아니라 `startOfNextMonth`를 쓴다** (db-migrator 제안 채택). 초안의 `$lt: now`는 매 호출 값이 달라져 쿼리가 비결정적일 뿐 아니라, 클럭 스큐로 `confirmedAt`이 `now`보다 미세하게 앞선 문서가 **조용히 집계에서 빠진다.** 월 경계로 고정하면 그 창이 닫힌다.

> **UI도 같은 TZ 유틸을 쓴다 (boundary-verifier 대조 지점).** ui-designer가 최근 주문의 상대시간을 그릴 때 7일 초과 건은 절대 날짜로 폴백하는데, 기존 `src/core/utils/date.ts`의 `formatDate`가 `getFullYear()`/`getMonth()`/`getDate()` 기반이라 서버 로컬 TZ(=UTC)로 렌더된다 — KST 밤 9시 주문이 하루 밀려 보인다. UI 신규 함수 `formatRelativeTime`의 폴백 분기가 `Asia/Seoul`을 명시해 이 문제를 피한다(`01_ui_flow.md` §3.3). **즉 카드 집계 경계와 리스트 날짜 표시가 둘 다 `Asia/Seoul` 기준이다.** 기존 `formatDate` 자체는 소비처가 전역이라 이번 스코프에서 건드리지 않는다.

### 5.2 매출 + 결제 주문 수 — 집계 1방으로 두 달치

두 지표는 모집단이 같으므로 **하나의 파이프라인**에서 뽑는다. `$facet`이 아니라 `$cond` 그룹핑을 쓴다:

```js
OrderModel.aggregate([
  {
    $match: {
      orderStatus: { $in: PAID_ORDER_STATUSES },
      confirmedAt: { $gte: startOfLastMonth, $lt: startOfNextMonth },
    },
  },
  {
    $group: {
      _id: { $cond: [{ $gte: ["$confirmedAt", startOfThisMonth] }, "current", "previous"] },
      revenue: { $sum: "$finalPrice" },
      count: { $sum: 1 },
    },
  },
])
```

- `orderSchema.index({ orderStatus: 1, confirmedAt: 1 })`가 이 `$match`를 완전 커버한다.
- 결과에서 `current`/`previous` 버킷을 꺼내되, **버킷이 없을 수 있다**(해당 월 결제 0건) → `?? 0`으로 폴백해서 §3의 "항상 number" 보장을 지킨다.
- 초안은 이 4개 값을 위해 쿼리 4개(`sumFinalPrice` 2회 + `countDocuments` 2회)를 날렸다. 1개로 줄어든다.
- **`$ifNull`로 `confirmedAt` 결측을 폴백하지 않는다** — `$match`에 표현식이 들어가면 위 인덱스 커버가 깨져 COLLSCAN이 된다. 결측 문제는 일회성 backfill로 푼다(§9).

### 5.3 상품 / 회원 카운트

```js
ProductModel.countDocuments({ deletedAt: null })
ProductModel.countDocuments({ deletedAt: null, createdAt: { $gte: startOfThisMonth } })
UserModel.countDocuments({ isDelete: false })
UserModel.countDocuments({ isDelete: false, createdAt: { $gte: startOfThisMonth } })
```

**두 모델이 서로 다른 소프트 삭제 컨벤션을 쓴다** — Product는 `deletedAt: Date | null`, User는 `isDelete: boolean`. 초안이 맞게 썼고, db-migrator가 실측으로 확인했다. 헷갈리기 쉬운 지점이라 명시해둔다.

`deletedAt: null`이 정확한 필터인 근거: `services/product.ts`의 모든 읽기 경로가 `{ deletedAt: null }`로 거르고, 소프트 삭제(`:327`)는 `status: "deleted"` + `deletedAt: new Date()`를 **함께** 세팅하며 복원(`:353`)이 둘 다 되돌린다 — 두 필드가 항상 동기화된다.

> `status`가 `"inactive"`/`"soldOut"`인 상품도 **포함**한다. "총 상품"은 관리자가 등록해둔 상품 자산의 총량이지 판매 중인 것만이 아니다.

### 5.4 최근 주문 5건

```js
OrderModel.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .select("merchantUid buyerName product.title finalPrice orderStatus createdAt")
  .lean()
```

- 상태 필터 없음(§2 Q3).
- `.lean()` 사용 — 결과를 그대로 매핑해 리턴하고 Document 메서드가 필요 없다(`services/AGENTS.md`).
- `product.title` → `productTitle` 평탄화는 서비스에서 한다.
- **`_id`를 리턴 타입에 노출하지 않으므로 ObjectId → string 변환이 필요 없다.** `merchantUid`(unique string)가 행 key 역할을 한다. 만약 나중에 `/admin/orders/[orderId]` 상세 링크가 생겨서 `orderId`가 필요해지면, 그때 `_id.toString()`을 명시적으로 변환해 필드를 추가한다(`services/AGENTS.md`의 ObjectId 변환 규칙).

> **인덱스 전제조건:** 이 쿼리는 필터가 없어서 기존 Order 인덱스 3개(전부 선두 필드가 `userId` 또는 `orderStatus`)를 못 쓴다 → COLLSCAN + in-memory sort다. MongoDB의 32MB 정렬 메모리 상한 때문에 주문이 쌓이면 쿼리 자체가 실패한다. **`{ createdAt: -1 }` 단일 인덱스가 필요하다** — db-migrator에 요청함(§9).

### 5.5 병렬 실행

쿼리들을 `Promise.all`로 병렬 실행한다. 초안은 9개 쿼리였고, §5.2의 통합만으로 6개(주문 집계 1 + 상품 2 + 회원 2 + 최근주문 1)가 된다.

db-migrator가 상품/회원도 `countDocuments` 2회씩 대신 같은 문서집합을 1회 스캔하는 `$cond` 집계로 합쳐 **총 4개**까지 줄인 형태를 `01_db_schema.md`에 확정했다. **반환 shape이 동일하므로 이 계약에는 영향이 없다** — 구현은 `01_db_schema.md`의 쿼리 형태를 따르되, §3의 리턴 타입 보장(항상 number, 버킷 없으면 `?? 0`)만 지키면 된다.

읽기 전용이므로 트랜잭션을 쓰지 않는다 — `services/AGENTS.md`의 트랜잭션 조건은 "여러 문서에 걸친 **쓰기**"이고, 여기 해당 없다. (트랜잭션 안에서 `Promise.all` 금지 규칙도 트랜잭션이 없으므로 무관하다.)

---

## 6. 에러 계약

### 실패 정책: all-or-nothing (3자 합의)

`Promise.all`이라 6개 중 하나라도 실패하면 전체가 reject되고, 페이지 렌더가 실패해 **`src/app/(admin)/error.tsx`가 통째로 잡는다**(해당 파일 실재 확인함).

이게 의도된 설계다 — **부분 렌더된 대시보드는 관리자에게 잘못된 판단을 유도한다.** 매출 카드만 비어 있는 화면을 보고 "이번 달 매출이 0"이라고 오해하는 것보다, 페이지 전체가 에러로 막히는 편이 안전하다. per-section 폴백 UI를 설계하지 않는다.

이 정책의 부수 효과로 **"집계는 됐는데 값을 모름" 상태가 타입에서 사라진다** — 그래서 §3의 "0은 언제나 진짜 0" 보장이 성립하고, UI는 `revenuePreviousMonth === 0 || paidOrderCountPreviousMonth === 0`을 안심하고 "전월 실적 없음 → trend 줄 렌더 생략"으로 해석할 수 있다.

### 에러 카테고리

| 상황 | 카테고리 | 비고 |
|---|---|---|
| DB 커넥션/타임아웃, 집계 실패, mongoose 예외 | `INTERNAL` | 유일하게 발생 가능한 분류 |
| 미인증 / 비관리자 | — | `AppError`가 아니라 `verifySession`의 `redirect()`로 처리된다(§7) |
| `VALIDATION` | 해당 없음 | 입력 파라미터가 없다 |
| `NOT_FOUND` | 해당 없음 | 조회 대상이 "없을 수 있는 단일 리소스"가 아니다. 데이터가 없으면 `0`/`[]`이지 404가 아니다 |
| `FORBIDDEN` / `UNAUTHENTICATED` / `DISABLED` / `EXTERNAL_SERVICE` | 해당 없음 | 외부 연동 없음, 기능 토글 없음 |

### 구현 규칙 (초안 결함 — backend-impl 필독)

**초안 `src/services/dashboard.ts`에는 try/catch가 전혀 없다.** 그래서 mongoose 예외(`CastError` 등)가 raw로 새어나가 `services/AGENTS.md`의 "services가 던지는 에러는 `AppError` 하나로 통일한다" 규칙을 위반한다. 반드시 감싸야 한다:

```ts
const [...] = await Promise.all([...]).catch((error) => {
  throw new AppError(
    "INTERNAL",
    error instanceof Error ? error.message : "대시보드 통계 조회에 실패했습니다.",
  );
});
```

`services/AGENTS.md`: "mongoose 자체 에러는 `AppError("INTERNAL", 원본 message)`로 감싸서 다시 throw한다."

> 참고: `invitation.ts:20`의 `toInternalError`는 그 파일 안의 **지역 헬퍼**라 import할 수 없다. 공용 유틸로 승격하는 건 이번 스코프 밖이다 — dashboard.ts 안에서 위 형태로 직접 처리한다.

> 원문 message가 응답에 실릴 걱정은 없다 — 이 경로는 클라이언트로 나가는 envelope이 아니라 RSC 렌더 예외이고, `error.tsx`는 Next.js가 프로덕션에서 자동으로 메시지를 가린 상태로 받는다.

### 빈 상태 (REQ-2)

주문이 한 건도 없으면 `recentOrders: []`가 내려간다. **이건 에러가 아니다.** UI가 빈 상태 문구를 렌더한다(REQ-2 수용 기준).

---

## 7. 인증 — 서비스 내부에서 재검증하지 않는다

**`getDashboardStatsService`는 세션/권한을 검사하지 않는다.** 접근 제어는 `page.tsx`의 `await verifySession("ADMIN")`가 전담한다(현재 코드에 이미 있음).

근거:

- `src/AGENTS.md`의 재검증 의무는 **Server Action** 대상이다 — Server Action은 "UI 없이 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있는" 실질적 엔드포인트라서다. 이 서비스 함수는 외부에서 호출 가능한 엔드포인트가 아니라 같은 프로세스 안의 함수 호출이며, 도달하는 유일한 경로가 이미 `verifySession("ADMIN")`으로 막힌 페이지다.
- `verifySession`은 실패 시 `AppError`를 던지지 않고 **`redirect()`** 한다(`services/auth.ts:143-152`). 리다이렉트는 UI 라우팅 관심사라 서비스 레이어 안에 들어가면 계층이 뒤집힌다.
- `src/proxy.ts`도 `/admin` 경로를 낙관적으로 한 겹 더 막는다(전체 방어선이 아니라 보조 — `page.tsx`의 `verifySession`이 실질 경계).

**backend-impl에게:** 서비스 안에 `verifySession`/`requireAdmin`을 넣지 마라. **boundary-verifier에게:** 서비스에 인증 검사가 없는 것은 결함이 아니라 위 근거에 따른 의도된 배치다.

---

## 8. 초안 대비 변경점 요약

| # | 항목 | 초안 | 확정 | 이유 |
|---|---|---|---|---|
| 1 | 매출 기준 시각 | `createdAt` | **`confirmedAt`** | 가상계좌 입금월 불일치 + 월경계 오분류. 기존 인덱스가 커버 |
| 2 | 주문 수 모집단 | 전체 주문(PENDING·CANCELLED 포함), `createdAt` | **결제 완료만(CONFIRMED+COMPLETED), `confirmedAt`** | 매출 카드와 모집단·시각 기준이 달라 `매출 ÷ 주문수 = 객단가`가 안 맞았다 |
| 3 | 주문 필드명 | `monthlyOrderCount` / `previousMonthOrderCount` | **`paidOrderCountThisMonth` / `paidOrderCountPreviousMonth`** | #2로 의미가 바뀌었는데 이름이 그 변화를 안 담아 "전체 주문"으로 오해된다 |
| 4 | 매출 필드명 | `monthlyRevenue` / `previousMonthRevenue` | **`revenueThisMonth` / `revenuePreviousMonth`** | 나머지 6개 필드가 전부 `…ThisMonth` 접미형인데 매출만 접두형이면 8개 필드에 두 규칙이 섞인다(db-migrator 제기) |
| 5 | 월 경계 계산 | 서버 로컬 TZ (`new Date(y, m, 1)`) | **KST 명시 (`getKstMonthRange`)** | Vercel TZ=UTC → "이번 달"이 KST와 9시간 어긋난다 |
| 6 | 매출/주문 쿼리 | 쿼리 4개(sum 2 + count 2) | **집계 1개(`$cond` 그룹핑)** | 모집단이 같아 한 파이프라인으로 뽑힌다. 총 9 → 6 → (db-migrator 추가 통합) 4 쿼리 |
| 7 | 매출 상태 상수 | `dashboard.ts` 지역 `REVENUE_STATUSES` | **`core/domain/order.ts`의 `PAID_ORDER_STATUSES`로 승격** | `payment.ts`/`invitation.ts`에 이미 흩어진 정의의 세 번째 사본을 만들지 않는다 |
| 8 | 에러 처리 | try/catch 없음 (raw mongoose 에러 누출) | **`AppError("INTERNAL", …)` 래핑** | `services/AGENTS.md` 위반 수정 |
| 9 | 집계 상한 | `$lt: now` | **`$lt: startOfNextMonth`** | `now` 상한은 비결정적이고, 클럭 스큐 문서가 조용히 누락된다 |
| 10 | 매출 상태 필터 | `CONFIRMED`+`COMPLETED` | **유지** | 재검토 결과 근거 확인됨(부분취소 없음, `isPaymentAppliedStatus`와 일치) |
| 11 | 최근 주문 5건 | 유지 | **유지** | 3자 합의 |
| 12 | 저량/유량 비대칭 필드 | 유지 | **유지 + 근거 명문화** | 카드 종류가 실제로 둘이라 의도된 비대칭이다 |
| 13 | `confirmedAt` 결측 | (미인지) | **backfill 선행 (§9)** | #1의 전제조건. db-migrator가 git 이력으로 실재 확인 |
| 14 | Order 인덱스 | (미인지) | **`{ createdAt: -1 }` 추가 (§9)** | 최근 주문 무필터 정렬이 32MB 상한에 걸려 쿼리가 실패한다 |

### 협의 결과 — 3자 합의 완료, 미해결 쟁점 없음

- **ui-designer** — 요청 1~6 전부 채택(원시 수치 / `0`은 진짜 0 / 최근주문 6필드 / 5건 / all-or-nothing / 비대칭 trend). 변경 #2·#3 및 카드 copy 수정 요청을 **전부 수용 회신**받음. `orderId`는 상세 라우트가 생길 때 요청하기로 보류.
- **db-migrator** — 제안 4건 전부 수용, 회신으로 필드명 #4·상한 #9·backfill 소스 정정을 받아 반영함.
- **독립 수렴:** `confirmedAt` 기준(#1)과 주문수 모집단 통일(#2)은 api-designer·db-migrator가 서로 모르는 상태에서 **같은 결론**에 도달했다. 반대로 §5.1(KST)·§5.4(인덱스)·§9(backfill)는 api-designer가 제기해 db-migrator가 검증했다.
- **1라운드 왕복으로 종결** — 3라운드 상한에 도달한 쟁점 없음.

### UI 카피 — ui-designer 확정본 (`01_ui_flow.md` §4.1.1)

| # | title | description | trend |
|---|---|---|---|
| 1 | 등록 상품 | 삭제 제외 전체 상품 | 이번 달 증가 건수 |
| 2 | 총 매출 | 이번 달 결제 완료 기준 | 전월 대비 % |
| 3 | 결제 주문 | 이번 달 결제 완료 주문 | 전월 대비 % |
| 4 | 활동 회원 | 탈퇴 제외 가입 회원 | 이번 달 증가 건수 |

- 3번은 변경 #2가 반영된 필수 수정이다.
- 1번 description은 api-designer가 제안한 "등록된 상품 수" 대신 ui-designer의 **"삭제 제외 전체 상품"**을 채택했다 — 집계 조건이 `deletedAt: null` 하나뿐이라 비공개(`inactive`)·품절(`soldOut`)까지 포함되는데, "등록된 상품 수"는 그 사실을 감춘다. description이 쿼리 조건과 1:1로 읽히는 편이 낫다. **동의함.**
- 유량 카드 둘(2·3)의 trend를 전월 대비 %로 통일 — 나란히 놓인 두 지표가 같은 형태여야 함께 읽힌다.
- mock의 `"+8 지난 주 대비"`(혼자만 주 단위)는 계승 금지.

---

## 9. 구현 전제조건 (확정 — **차단 조건**, 코드보다 먼저 처리)

두 건 모두 db-migrator 검증을 거쳐 확정됐다. 타입 시그니처는 이걸 안 해도 컴파일되지만, **건너뛰면 계약대로 구현해도 숫자가 틀리거나 쿼리가 실패한다.**

> **"리턴 타입에 영향 없음"으로 읽지 마라 (ui-designer 지적 반영).** 전제-1을 건너뛰면 매출·결제주문 카드가 **에러 없이 조용히 축소된 숫자를 렌더한다.** UI는 §3의 "0은 언제나 진짜 0" 보장을 근거로 `-`·"데이터 없음" 폴백을 **의도적으로 전부 제거했으므로**(`01_ui_flow.md` §7 Q14), 축소된 값은 화면에서 정상값과 구분이 불가능하다. 던져지는 에러도 빈 상태도 아닌 **그럴듯한 오답**이라 이 화면에서 가장 위험한 실패 양상이다. 순서 권고가 아니라 차단 조건으로 취급한다.

### 전제-1. `confirmedAt` 결측 backfill — **가설이 아니라 실재하는 결함**

db-migrator가 git 이력으로 확인한 결과, 결측이 발생할 수 있는 구간이 실제로 존재했다:

| 시점 | 상태 |
|---|---|
| ~2026-07-29 이전 | 결제 확정 코드가 `orderStatus="CONFIRMED"` + `paymentId` 대입 후 `save()`만 실행 — **`confirmedAt` 대입 없음** |
| 2026-07-29 PR #77 (`e2eb63e`) | `Order.confirmedAt` 필드 신설 |
| 이후 (`payment.ts:364`) | 항상 세팅 |

**즉 PR #77 배포 이전에 결제 확정된 운영 주문은 `confirmedAt`이 없다.** 변경 #1(`confirmedAt` 기준 집계)을 그대로 적용하면 그 주문들이 **에러 없이 조용히 매출에서 빠진다** — 숫자만 작아지는 최악의 실패 모드다. (7/29가 최근이라 실제 해당 건수는 0일 수도 있다. 코드로는 알 수 없어 실측이 필요하다.)

**확정 절차** (`01_db_schema.md` §4-1, backend-impl이 구현 전 1회 수행):

1. 실측: `db.orders.countDocuments({ orderStatus: { $in: ["CONFIRMED","COMPLETED"] }, confirmedAt: null })` — `null` 비교가 필드 누락 문서까지 함께 잡는다
2. **0건** → 문서에 "확인 완료(0건)" 기록하고 그대로 진행
3. **1건 이상** → backfill 1회 수행. 조건이 `confirmedAt: null`이라 멱등하다

**backfill 소스 우선순위: `Payment.paidAt` > `Order.createdAt`.** `payment.model.ts:236`에 `paidAt`이 있고 `:192`의 `merchantUid`가 unique라 주문과 1:1 조인된다 — 실제 결제 완료 시각이라 정답에 가장 가깝다.

> ⚠️ **`updatedAt`을 소스로 쓰면 안 된다.** api-designer가 초안으로 제시했다가 db-migrator가 반박해 철회한 안이다 — §2 Q2에서 근거로 든 `invitation.ts:216`의 `CONFIRMED` ↔ `COMPLETED` 토글이 바로 그 `updatedAt`을 갱신하기 때문에, 청첩장을 발행/비공개한 주문의 `updatedAt`은 결제 시각과 완전히 무관해진다. 매출 기준의 안정성 근거였던 사실이 backfill 소스로는 정반대로 작용한다.

> 운영 DB 접근은 설계 단계에서 아무도 수행하지 않았다 — **리더 확인 사항**(`01_db_schema.md` §7).

### 전제-2. Order `{ createdAt: -1 }` 인덱스 — 권고에서 **필수**로 승격

§5.4의 무필터 정렬 전제조건. db-migrator가 분석에 동의하고 필수로 확정했다: 32MB blocking-sort 상한은 "느려짐"이 아니라 **"쿼리 실패"**라 대시보드가 통째로 죽는다.

덤으로, `/admin/orders`가 지금 `mockOrders`를 쓰고 있고 곧 실데이터 전환 대상인데 **그 관리자 전역 주문 목록도 `userId` 스코프가 없어** 같은 인덱스를 필요로 한다. 이번 기능에 넣는 게 맞다.

---

## 10. backend-impl 구현 체크리스트

**선행(코드보다 먼저):**
- [ ] §9 전제-1 — `confirmedAt: null` 건수 실측, 1건 이상이면 `Payment.paidAt` 기준 backfill
- [ ] §9 전제-2 — Order `{ createdAt: -1 }` 인덱스 추가 (`01_db_schema.md` 참조)

**코드:**
- [ ] `src/core/domain/order.ts` — `PAID_ORDER_STATUSES` 추가
- [ ] `src/core/domain/dashboard.ts` — §3 타입으로 교체. **필드명 4개가 초안과 다르다**: `monthlyRevenue`→`revenueThisMonth`, `previousMonthRevenue`→`revenuePreviousMonth`, `monthlyOrderCount`→`paidOrderCountThisMonth`, `previousMonthOrderCount`→`paidOrderCountPreviousMonth`
- [ ] `src/core/utils/date.ts` — `getKstMonthRange` 추가 (3개 경계 반환) + `src/core/utils/index.ts` 배럴 확인
- [ ] `src/core/utils/date.test.ts` — `getKstMonthRange` 단위 테스트(월초/월말 KST 경계, 1월→전월이 작년 12월, UTC와 9시간 어긋나는 케이스). 현재 `date.ts`에는 테스트 파일이 없다
- [ ] `src/services/dashboard.ts` — §5 쿼리로 재작성(`01_db_schema.md`의 4-쿼리 형태 채택) + §6 `AppError` 래핑
- [ ] `src/core/domain/index.ts` / `src/services/index.ts` 배럴 (초안이 이미 추가해둠, 유지)
- [ ] `src/app/(admin)/admin/dashboard/page.tsx` — 하드코딩 `stats` 배열 제거, `getDashboardStatsService()` await 후 Template에 props 전달
- [ ] 워킹트리의 미커밋 초안(`ORDER_STATUS_LABELS` 승격 포함)을 **덮어쓰지 말고 위 변경점을 반영해 수정**할 것

**boundary-verifier 대조 지점:**
1. 초안 `dashboard.ts`가 아직 **구 필드명**을 쓰고 있다 — 서비스 리턴/도메인 타입/UI 소비처 3곳이 새 이름으로 일치하는지
2. `recentOrders[].createdAt`이 `Date`인지 (`string`으로 변질되면 JSON 경계가 어딘가 생겼다는 뜻)
3. 카드 집계 경계(`getKstMonthRange`)와 UI 날짜 표시(`formatRelativeTime` 폴백)가 **둘 다 `Asia/Seoul`** 기준인지 (§5.1)
4. envelope(`{success, data}`)이 이 경로에 끼어들지 않았는지 (§1)

### 하지 말 것

- route handler / Server Action / zod 스키마 생성 (§1)
- `{ success, data }` envelope 사용 (§1)
- 서비스 안 `verifySession`/`requireAdmin` 호출 (§7)
- `unstable_cache` 등 캐싱 부착 (§4)
- per-section 부분 실패 폴백 (§6)
- 서버에서 표시 문자열(통화·%·상대시간) 포맷 (§3)
