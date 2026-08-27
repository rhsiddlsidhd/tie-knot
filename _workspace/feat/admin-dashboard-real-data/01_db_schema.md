# 01_db_schema.md — admin 대시보드 실데이터 집계 설계

> 담당: db-migrator / Phase 1 — api-designer·ui-designer 조율 반영 완료(1라운드)
> 결론 요약: **신규 컬렉션·신규 필드 없음.** 기존 Order/Product/User를 읽기 전용으로 집계한다.
> 단 **레거시 `confirmedAt` 결측 backfill 1건은 조건부 필수**다(§4-1 — 배포 전 확인 필요, 매출이 조용히 누락되는 실패 모드).
> 초안(`src/services/dashboard.ts`) 대비 변경점: 매출 기준 시각, 주문수 모집단, KST 월 경계, 쿼리 병합, 필드명. 인덱스 1건 필수 + 2건 권고.

---

## 1. 필드 실측 검증 (초안 가정 vs 실제 스키마)

| 초안 가정 | 실제 | 판정 |
|---|---|---|
| `Order.orderStatus` enum `PENDING/CONFIRMED/COMPLETED/CANCELLED` | 동일 (`order.model.ts:68-73`, `core/domain/order.ts:33-38`에도 `ORDER_STATUSES`로 중복 정의) | 실재 |
| `Order.finalPrice: number` (required) | 동일 (`order.model.ts:118`) | 실재 |
| `Order.createdAt` | `{ timestamps: true }` (`order.model.ts:146`) | 실재 |
| `Order.confirmedAt?: Date` | 실재 (`order.model.ts:92`) — CONFIRMED 전이 시각, `payment.ts:364`에서만 세팅 | 초안 미사용 → **사용 권고**(§2) |
| `Product.deletedAt` 소프트 삭제 | 실재. `deletedAt: { type: Date, default: null }` — **optional이 아니라 nullable**, 모든 문서에 항상 존재 (`product.model.ts:144`) | 실재 |
| `User.isDelete` 소프트 삭제 | 실재. `isDelete: { type: Boolean, default: false }` (`user.model.ts:29`) | 실재 |

### 소프트 삭제 컨벤션이 모델마다 다른 건 실제 사실이다

초안이 Product엔 `deletedAt: null`, User엔 `isDelete: false`를 쓴 건 **오류가 아니라 프로젝트 현실을 정확히 반영한 것**이다.

- Product: `services/product.ts`의 조회 경로 전부가 `{ deletedAt: null }`로 거른다(단건/목록/좋아요/휴지통 12개 지점). 소프트 삭제 시 `status: "deleted"`도 같이 세팅되지만(`product.ts:327`) **판별 기준(canonical)은 `deletedAt`**이다 — 복원은 `{ status: "active", deletedAt: null }`. 대시보드도 `deletedAt`을 쓴다(`status`를 쓰면 `inactive`/`soldOut`까지 어떻게 셀지 별도 정책이 필요해지고 기존 목록 화면 카운트와 어긋난다).
- User: `services/user.ts:60`이 `{ email, isDelete: false }`. `deletedAt` 필드 자체가 없다.

> 컨벤션 통일은 이 기능의 스코프가 아니다. 통일하려면 User에 `deletedAt` 추가 + 전 문서 backfill + 기존 쿼리 전수 수정이 필요하므로, 별도 Issue 대상으로 남긴다.

### 매출 인정 상태 = `CONFIRMED | COMPLETED` — 근거 확인됨

초안의 필터가 맞다. 임의 선택이 아니라 프로젝트에 이미 존재하는 정의와 일치한다.

- `services/payment.ts:61-62` `isPaymentAppliedStatus(orderStatus) = orderStatus === "CONFIRMED" || orderStatus === "COMPLETED"` — 결제 중복 반영 방지 판정이 쓰는 "결제가 이미 반영된 상태"의 정의.
- `services/invitation.ts:63` 청첩장 사용 가능 조건도 같은 두 값.
- 상태 전이 실측:
  - `PENDING` → 결제 전(결제창 미진입 또는 가상계좌 입금 대기). 매출 아님.
  - `CONFIRMED` — `payment.ts:362-364` 결제 PAID 확인 시 전이 + `confirmedAt` 세팅 + `Product.salesCount` 증가(트랜잭션).
  - `COMPLETED` — `invitation.ts:230` 청첩장 발행 시 CONFIRMED→COMPLETED. **결제와 무관한 이행 완료 상태**라 매출에서 빼면 안 된다(발행하면 매출이 사라지는 버그가 된다).
  - `CANCELLED` — 취소/환불. `payment.ts:635` 환불은 **항상 전액 취소 후 orderStatus를 CANCELLED로 전이**한다(부분 취소 경로 없음). 따라서 `$in: [CONFIRMED, COMPLETED]` 필터만으로 환불건이 자동 제외된다 — 별도 환불 차감 로직 불필요.

---

## 2. 확정 쿼리 설계

### 2-0. 월 경계는 KST로 계산한다 (초안 수정 필수)

초안의 `new Date(now.getFullYear(), now.getMonth(), 1)`은 **서버 로컬 타임존**을 쓴다. 배포 환경 서버 TZ는 UTC이고 프로젝트에 TZ 고정 설정이 없으므로, 그대로 두면 "이번 달"이 UTC 월 경계가 돼 KST와 9시간 어긋난다 — 9/1 새벽(KST) 결제건이 8월 매출로 잡히고, 관리자가 주문 목록과 대조하면 숫자가 안 맞는다.

`date-fns@^4.1.0` + `date-fns-tz@^3.2.0`이 이미 설치돼 있고 프로젝트에 `"Asia/Seoul"` 사용 선례가 있다. 경계 계산은 **순수 함수**이므로 `src/core/utils/`에 두고(부수효과·서버 전용 의존 없음 → `src/core/AGENTS.md` 경계 충족) 서비스는 그 결과(UTC instant)를 그대로 쿼리에 넣는다.

```ts
// src/core/utils/ — 순수 함수. 반환값은 전부 UTC instant(Date)라 쿼리에 그대로 넣는다.
const { startOfThisMonth, startOfLastMonth, startOfNextMonth } = getKstMonthRange(new Date());
```

DB 스키마에는 영향이 없다 — MongoDB에 저장되는 `Date`는 이미 UTC instant이고, 바뀌는 건 비교 경계값뿐이다. 아래 쿼리의 `startOf*` 변수는 전부 이 KST 기준 경계를 가리킨다.

### Q1. Order — 매출 + 주문수 (이번달/전달 한 방)

**초안 대비 변경 2건: `createdAt` → `confirmedAt`, 그리고 쿼리 4개 → aggregation 1개.**

```ts
OrderModel.aggregate<{ _id: "current" | "previous"; revenue: number; orderCount: number }>([
  {
    $match: {
      // core/domain/order.ts로 승격한 상수를 참조한다(dashboard 로컬 사본 금지)
      orderStatus: { $in: PAID_ORDER_STATUSES },
      confirmedAt: { $gte: startOfLastMonth, $lt: startOfNextMonth },
    },
  },
  {
    $group: {
      _id: { $cond: [{ $gte: ["$confirmedAt", startOfThisMonth] }, "current", "previous"] },
      revenue: { $sum: "$finalPrice" },
      orderCount: { $sum: 1 },
    },
  },
]);
// 결과 없는 버킷은 행 자체가 안 나온다 → 호출부에서 `?? 0` 폴백 필수.
```

**왜 `confirmedAt`인가**
1. 정확성 — 가상계좌 주문은 생성월과 입금월이 갈릴 수 있다(`PENDING_ORDER_EXPIRE_HOURS = 24`는 결제창 미진입 주문에만 적용되고, 가상계좌는 개별 입금기한을 따른다). `createdAt` 기준이면 "이번 달 매출"이 실제 입금 시점과 어긋난다.
2. 성능 — `{ orderStatus: 1, confirmedAt: 1 }` 인덱스가 **이미 존재**한다(`order.model.ts:162`). 이 필터 조합이 선두 두 키에 정확히 대응해 인덱스로 완전 커버된다. `createdAt` 기준이면 `{orderStatus:1, paymentId:1, createdAt:1}`의 2번째 키(`paymentId`)를 건너뛰게 돼 인덱스 바운드가 끊긴다.

**왜 주문수 모집단을 매출과 같게 맞추나**
초안은 주문수를 전체 주문(`OrderModel.countDocuments({ createdAt: ... })`)으로 셌다. 이러면 (a) 자동취소되는 방치 PENDING이 카운트를 부풀리고, (b) 옆 카드의 매출과 모집단이 달라 "매출 ÷ 주문수 = 객단가"가 성립하지 않으며, (c) `createdAt` 단독 필터를 쓸 인덱스가 없어 COLLSCAN이다. 매출과 같은 모집단으로 통일하면 셋 다 해결되고 쿼리도 위 aggregation에 흡수된다.

**보강 근거(api-designer)**: `invitation.ts:216`이 청첩장 발행/비공개 토글로 `CONFIRMED ↔ COMPLETED`를 왕복시킨다. 두 상태는 "결제 반영됨"의 두 얼굴이고, `confirmedAt`은 `payment.ts:364`에서 **1회만** 세팅되므로 이 토글에 영향받지 않는다 — 발행/비공개를 반복해도 매출 귀속 월이 흔들리지 않는다.

**`PAID_ORDER_STATUSES` core 승격(동의) — 단 스코프는 "새 사본을 안 만드는 것"까지다**: 초안이 `dashboard.ts`에 새로 선언한 `REVENUE_STATUSES`를 `src/core/domain/order.ts`에 `PAID_ORDER_STATUSES`로 올리고 대시보드가 그걸 참조한다. 도메인 상수이므로 core 소관이고 모델 변경이 아니다.

같은 두 값이 `payment.ts:61`(`isPaymentAppliedStatus`)와 `invitation.ts:63`에도 있지만 **이번 스코프에서 그 둘은 건드리지 않는다**(api-designer와 합의). 결제 경로 리팩터링은 회귀 위험 대비 이득이 작다 — 지금 필요한 건 "사본이 3개에서 4개로 늘지 않는 것"이고, 완전 통합은 결제 로직을 손대는 별도 작업에서 묶는 게 맞다.

> 주문 수 모집단은 api-designer가 동일 결론에 독립 도달해 **CONFIRMED+COMPLETED / confirmedAt 기준으로 확정**했다. 관리자가 *유입 주문 총량*을 원한다는 요구가 나중에 나오면 별도 지표로 추가한다(기존 지표를 바꾸지 않는다).

### Q2. Order — 최근 활동 (최근 주문 5건)

```ts
OrderModel.find()
  .sort({ createdAt: -1 })
  .limit(5)
  .select("merchantUid buyerName product.title finalPrice orderStatus createdAt")
  .lean();
```

- 정렬 기준은 **`createdAt`**(매출 집계와 달리 `confirmedAt`이 아니다). "최근 활동"은 관리자가 방금 들어온 주문을 보는 화면이라 결제 전 `PENDING`도 보여야 하고, PENDING은 `confirmedAt`이 없어 confirmedAt 정렬에서 통째로 사라진다.
- `.lean()` 필수 — 수정 없이 그대로 반환하므로(`services/AGENTS.md`).
- `merchantUid`는 `unique: true` 인덱스가 있으나 여기선 표시용일 뿐이다. `_id`는 select 안 해도 기본 포함되므로 UI key로 쓸 거면 `.toString()` 변환을 services에서 명시적으로 해야 한다(모델 `toJSON` transform은 `.lean()`에 안 걸린다 — `src/models/AGENTS.md`).
- **인덱스 없음 → 현재 blocking in-memory SORT다.** §3-A 참고.

> **boundary-verifier 주의 — 통계 카드와 최근 주문 리스트가 서로 다른 시각 기준을 쓰는 것은 의도다.**
> 카드(Q1) = `confirmedAt` 기준 + `CONFIRMED|COMPLETED`만. 리스트(Q2) = `createdAt` 기준 + 전 상태 포함.
> 불일치가 아니라 두 지표의 질문이 다르다("이번 달에 얼마가 입금됐나" vs "방금 뭐가 들어왔나"). 리스트에 PENDING 주문이 떠도, 그 주문이 매출 카드에 안 잡혀도 정상이다. ui-designer와 합의된 사항이며 상태 배지가 그 차이를 화면에서 설명한다.

### Q3. Product — 총 상품 + 이번달 신규 (한 방)

```ts
ProductModel.aggregate<{ total: number; createdThisMonth: number }>([
  { $match: { deletedAt: null } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      createdThisMonth: {
        $sum: { $cond: [{ $gte: ["$createdAt", startOfThisMonth] }, 1, 0] },
      },
    },
  },
]);
```

초안은 `countDocuments` 2번이었다. 어차피 둘 다 같은 문서 집합을 훑으므로 1회 스캔으로 합친다. `deletedAt: null`은 스키마 default가 `null`이라 필드 누락 문서가 없어 `$eq: null`로 안전하다.

> **discriminator 주의(읽기는 무해)**: `ProductModel`은 `category`를 `discriminatorKey`로 쓰고 `invitation` discriminator가 등록돼 있다. mongoose는 base 모델 `find`/`aggregate`에 discriminator 필터를 걸지 않으므로 base 모델로 세면 전 카테고리가 다 잡힌다 — 대시보드가 원하는 동작이 맞다. (반대로 `InvitationProductModel`로 세면 `category: "invitation"`만 잡힌다.)

### Q4. User — 총 회원 + 이번달 신규 (한 방)

```ts
UserModel.aggregate<{ total: number; createdThisMonth: number }>([
  { $match: { isDelete: false } },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      createdThisMonth: {
        $sum: { $cond: [{ $gte: ["$createdAt", startOfThisMonth] }, 1, 0] },
      },
    },
  },
]);
```

`isDelete`는 default `false`지만 **필드가 누락된 레거시 문서가 있으면 `{ isDelete: false }`가 그 문서를 못 잡는다.** 방어하려면 `{ isDelete: { $ne: true } }`가 안전하다. 스키마에 default가 있어 mongoose 경유 생성 문서는 전부 필드를 갖지만, 이 컬렉션에 mongoose 밖 삽입 이력이 있는지는 코드로 확인 불가 → 구현 시 backend-impl이 실 DB에서 `db.users.countDocuments({ isDelete: { $exists: false } })` 한 번 확인하고, 0이면 `false` 그대로, 아니면 `$ne: true`로 바꾼다. (Product의 `deletedAt`은 `$in`/`$ne: null` 형태로 이미 전 서비스가 쓰고 있어 동일 리스크가 이미 수용된 상태다.)

### 실행 형태

```ts
await dbConnect();
const [orderBuckets, productStats, userStats, recentOrders] = await Promise.all([...]);
```

- **트랜잭션 불필요.** `services/AGENTS.md` 트랜잭션 섹션 기준은 "서로 다른 문서/컬렉션에 걸친 **쓰기**가 부분 실패 시 불변조건을 깨는 경우"다. 여기는 순수 읽기 4건이라 해당 없음.
- 따라서 `Promise.all` 병렬이 적합하다. (AGENTS.md의 "트랜잭션 안에서 `Promise.all` 금지" 제약은 세션이 있을 때만 적용되며 여기엔 세션이 없다.)
- 쿼리 수: 초안 9개 → **4개**.

---

## 3. 인덱스 점검

현재 정의된 인덱스 전량:

| 컬렉션 | 인덱스 | 출처 |
|---|---|---|
| Order | `{ merchantUid: 1 }` unique | 필드 옵션 |
| Order | `{ userId: 1 }` | 필드 옵션 |
| Order | `{ userId: 1, orderStatus: 1, createdAt: -1 }` | `order.model.ts:155` (my-orders 페이징) |
| Order | `{ orderStatus: 1, paymentId: 1, createdAt: 1 }` | `:161` (만료 PENDING 배치) |
| Order | `{ orderStatus: 1, confirmedAt: 1 }` | `:162` (만료 CONFIRMED 배치) |
| Product | **없음** (`_id`만) | — |
| User | `{ email: 1 }` unique | 필드 옵션 |

쿼리별 판정:

| 쿼리 | 인덱스 | 판정 |
|---|---|---|
| Q1 매출/주문수 | `{ orderStatus: 1, confirmedAt: 1 }` | **커버됨.** `$in` 2값 × range → IXSCAN 2바운드 |
| Q2 최근 주문 5건 | 없음 | **COLLSCAN + blocking SORT** — A 권고 |
| Q3 상품 집계 | 없음 | COLLSCAN — B 권고 |
| Q4 회원 집계 | 없음 | COLLSCAN — C 권고 |

### A (필수) — `orderSchema.index({ createdAt: -1 })`

Q2는 **필터가 아예 없는 전역 정렬**이다. 기존 Order 인덱스 3개는 전부 선두 필드가 `userId` 또는 `orderStatus`라 무필터 정렬을 못 받쳐준다 → **컬렉션 전체를 읽고 메모리에서 정렬한 뒤 5건을 취한다.** 데이터가 커지면 32MB blocking-sort 한계에 걸려 대시보드가 통째로 에러를 던지는 형태로 실패한다(느려지는 게 아니라 죽는다). 인덱스가 있으면 IXSCAN 5건에서 멈춘다.

**Q2 설계(PENDING 포함 / `createdAt` desc)의 전제조건이므로 권고가 아니라 필수로 확정한다** — api-designer와 합의된 사항.

부수 효과로 `/admin/orders`(현재 `mockOrders.ts` 사용 중, 곧 실데이터 전환 대상)의 **관리자 전역 주문 목록**도 이 인덱스가 그대로 커버한다 — 기존 `{userId:1, ...}` 인덱스는 userId 스코프가 없는 관리자 목록엔 못 쓴다.

### B (권고) — `productSchema.index({ deletedAt: 1, createdAt: -1 })`

Q3뿐 아니라 `getAllProducts`의 목록 뷰(`{deletedAt: null}`)와 휴지통 뷰(`{deletedAt: {$ne: null}}`)가 동일 패턴이다(`services/product.ts:175`). Product 컬렉션에 인덱스가 하나도 없는 현 상태를 감안하면 이 기능과 무관하게도 필요하다.

### C (권고, 우선순위 낮음) — `userSchema.index({ isDelete: 1, createdAt: -1 })`

Q4 전용. 회원 수는 상품/주문보다 증가가 빠르지만 카디널리티가 낮은 boolean 선두라 이득이 제한적이다. A/B와 달리 **이 기능 스코프 밖으로 미뤄도 된다.**

### 인덱스 추가 시 운영 영향

`src/db/connect.ts`가 `autoIndex`를 끄지 않아 mongoose 기본값(`autoIndex: true`)이 유효 → 스키마에 `.index()`를 추가하면 **다음 연결 시 자동 생성된다. 별도 마이그레이션 스크립트 불필요.** 현재 데이터 규모에서 빌드 비용은 무시 가능하다.

---

## 4. 마이그레이션 / backfill

**스키마 마이그레이션은 없다** — 필드를 추가하지 않고 기존 필드만 읽는다. 단 아래 1번은 **데이터 backfill이 조건부 필수**다.

### 4-1. `Order.confirmedAt` 결측 — 리스크 실재함, 배포 전 확인 필수 ⚠️

git 이력을 추적한 결과 **`confirmedAt` 없이 `CONFIRMED`가 된 주문이 존재할 수 있는 구간이 실제로 있었다.**

| 시점 | 상태 |
|---|---|
| ~ 2026-07-29 이전 | 결제 확정 코드가 `order.orderStatus = "CONFIRMED"; order.paymentId = ...; order.save()`만 실행 — **`confirmedAt` 대입 없음** (해당 시점 `payment.service.ts:174-176`에서 확인) |
| 2026-07-29 (PR #77, `e2eb63e`) | `Order.confirmedAt` 필드 신설 |
| 이후 (`payment.ts:364`) | CONFIRMED 전이 시 `confirmedAt` 항상 세팅 |

즉 **PR #77 배포 이전에 결제 확정된 운영 주문은 `confirmedAt`이 없다.** confirmedAt 기준 집계에서 이 문서들은 에러 없이 조용히 빠져 매출 숫자만 작아진다 — 가장 나쁜 실패 모드다. (다만 2026-07-29는 최근이고 실 결제 데이터가 그 이전에 얼마나 쌓였는지는 코드로 알 수 없다. 0건일 가능성도 충분하다.)

**폴백 쿼리(`$ifNull: ["$confirmedAt", "$createdAt"]`)는 채택하지 않는다** — `$match`에 표현식을 쓰면 §3의 `{orderStatus:1, confirmedAt:1}` 인덱스 커버가 깨져 COLLSCAN이 된다. 영구 성능 비용으로 일회성 데이터 문제를 덮는 건 교환비가 나쁘다.

**절차 (backend-impl이 구현 전 1회 수행)**

```js
// 1) 결측 건수 확인
db.orders.countDocuments({
  orderStatus: { $in: ["CONFIRMED", "COMPLETED"] },
  confirmedAt: null,   // null과 필드 누락을 모두 잡는다
});
```

- **0건이면** → backfill 불필요. 이 문서에 "확인 완료(0건)"로 기록하고 진행.
- **1건 이상이면** → 아래 backfill을 1회 실행한 뒤 진행.

```js
// 2) backfill — 소스 우선순위: Payment.paidAt > Order.createdAt
//    Payment 컬렉션에 실제 결제 완료 시각(paidAt)이 있으므로 이게 정답에 가장 가깝다.
//    (payment.model.ts:236 paidAt, :192 merchantUid unique — merchantUid로 1:1 조인)
db.orders.aggregate([
  { $match: { orderStatus: { $in: ["CONFIRMED", "COMPLETED"] }, confirmedAt: null } },
  { $lookup: { from: "payments", localField: "merchantUid", foreignField: "merchantUid", as: "p" } },
  { $project: { fallback: { $ifNull: [{ $first: "$p.paidAt" }, "$createdAt"] } } },
]).forEach((d) => db.orders.updateOne({ _id: d._id }, { $set: { confirmedAt: d.fallback } }));
```

- `updatedAt`을 소스로 쓰면 **안 된다** — 청첩장 발행(`invitation.ts:230`의 CONFIRMED→COMPLETED)이나 이후 어떤 쓰기로든 갱신돼 결제 시각과 무관해진다.
- `createdAt` 폴백은 가상계좌 주문에서 실제 입금 시각보다 이르게 잡히지만, 대상이 레거시 소수 건이고 매출에서 통째로 누락되는 것보다는 낫다.
- 멱등하다 — 조건이 `confirmedAt: null`이라 재실행해도 이미 채워진 문서를 건드리지 않는다.

### 4-2. `User.isDelete` 결측 — 확인만, 리스크 낮음

§Q4 참고. `isDelete`는 스키마 default가 `false`라 mongoose 경유 생성 문서엔 항상 있지만, mongoose 밖 삽입 이력 여부는 코드로 확인 불가하다.

```js
db.users.countDocuments({ isDelete: { $exists: false } });
// 0이면 { isDelete: false } 그대로 사용
// 0이 아니면 $set: { isDelete: false } 로 backfill (또는 쿼리를 { isDelete: { $ne: true } }로 변경)
```

Product의 `deletedAt`은 동일 리스크가 이미 전 서비스 코드에서 수용된 상태라(12개 지점이 `deletedAt` 조건으로 조회 중) 별도 확인이 불필요하다.

---

## 5. API 필드명 ↔ DB 필드 매핑표

api-designer의 응답 shape과 정렬한 결과. **DB 원본 필드명을 그대로 노출하지 않고 평탄화하는 지점은 `productTitle` 하나뿐이다.**

| 응답 필드 (`DashboardStats`) | DB 소스 | 산출 |
|---|---|---|
| `totalProducts` | `products` | Q3 `total` |
| `productsCreatedThisMonth` | `products.createdAt` | Q3 `createdThisMonth` |
| `totalUsers` | `users` | Q4 `total` |
| `usersCreatedThisMonth` | `users.createdAt` | Q4 `createdThisMonth` |
| `revenueThisMonth` | `orders.finalPrice` | Q1 `current.revenue ?? 0` |
| `revenuePreviousMonth` | `orders.finalPrice` | Q1 `previous.revenue ?? 0` |
| `paidOrderCountThisMonth` | `orders` | Q1 `current.orderCount ?? 0` |
| `paidOrderCountPreviousMonth` | `orders` | Q1 `previous.orderCount ?? 0` |
| `recentOrders[].merchantUid` | `orders.merchantUid` | 그대로 |
| `recentOrders[].buyerName` | `orders.buyerName` | 그대로 |
| `recentOrders[].productTitle` | `orders.product.title` (스냅샷) | **평탄화** |
| `recentOrders[].finalPrice` | `orders.finalPrice` | 그대로 |
| `recentOrders[].orderStatus` | `orders.orderStatus` | 그대로 (`OrderStatus` 타입 재사용) |
| `recentOrders[].createdAt` | `orders.createdAt` | 그대로 (`Date` — §6 미해결) |

**필드명 변경 (초안 대비, api-designer 요청 수용)**

| 초안 | 확정 | 사유 |
|---|---|---|
| `monthlyOrderCount` | `paidOrderCountThisMonth` | 모집단이 "전체 주문"→"결제 완료 주문"으로 바뀌었는데 이름이 그 변화를 안 담아 오독을 부른다 |
| `previousMonthOrderCount` | `paidOrderCountPreviousMonth` | 위와 동일 |
| `monthlyRevenue` | `revenueThisMonth` | 나머지 6개 필드가 전부 `...ThisMonth` 접미사를 쓴다 — 8개 필드의 시점 표기를 한 규칙으로 통일 |
| `previousMonthRevenue` | `revenuePreviousMonth` | 위와 동일 |

- 전 필드 camelCase, snake_case 없음.
- `productTitle`은 Product 컬렉션 join이 아니라 **주문 시점 스냅샷**(`order.product.title`)이다. 상품명이 나중에 바뀌거나 상품이 소프트 삭제돼도 최근 활동 목록은 주문 당시 이름을 그대로 보여준다 — 의도된 동작이며 `$lookup` 불필요.
- `orderStatus` 표시는 `core/domain/order.ts`의 `ORDER_STATUS_LABELS` / `ORDER_STATUS_BADGE_VARIANTS`를 재사용한다(초안이 admin/orders mock 상수에서 도메인으로 승격시킨 것 — 그 승격은 타당하므로 유지 권고).

---

## 6. 동료 조율 결과 (1라운드, 전부 합의 — 미해결 쟁점 없음)

| 쟁점 | 제기 | 결론 |
|---|---|---|
| 매출 기준 시각 `createdAt` → `confirmedAt` | db-migrator | **합의.** api-designer가 독립적으로 동일 결론 도달 |
| 주문수 모집단을 매출과 통일 | db-migrator | **합의.** 필드명도 `paidOrderCount*`로 변경 |
| 최근 활동 = 최근 주문 5건, `createdAt` desc, PENDING 포함 | db-migrator | **합의.** 다른 컬렉션 혼합 안 함 |
| `recentOrders[].createdAt` 직렬화 타입 | db-migrator 질의 | **`Date` 확정.** Server Component 직결(`docs/architecture/data-access.md` row 1) — route handler 경유 없음, JSON 직렬화 경계 없음 |
| KST 월 경계 | api-designer | **수용.** §2-0에 반영 |
| `{ createdAt: -1 }` 인덱스 | api-designer | **수용.** 권고 → **필수**로 승격(§3-A) |
| 레거시 `confirmedAt` 결측 | api-designer | **리스크 실재 확인.** git 이력상 PR #77(2026-07-29) 이전 결제 확정 주문엔 `confirmedAt`이 없다 → §4-1 조건부 backfill 절차 확정. 폴백 쿼리는 인덱스를 깨므로 불채택 |
| `PAID_ORDER_STATUSES` core 승격 | api-designer | **동의.** 도메인 상수라 모델 변경 아님. 스코프는 "대시보드가 새 사본을 안 만드는 것"까지 — 기존 `isPaymentAppliedStatus`/`invitation.ts:63` 리팩터링은 결제 경로 회귀 위험 대비 이득이 작아 제외 |
| soft delete 판별 조건 / `timestamps` 유무 | ui-designer 질의 | **회신 완료.** Product=`deletedAt: null`, User=`isDelete: false`, 세 모델 모두 `timestamps: true`. UI 문구는 "등록 상품" / "활동 회원"으로 정정 권고 |

## 7. 리더 확인 필요 (설계 밖 판단)

1. **배포 전 §4-1 backfill 확인** — 운영 DB에 접근해 `confirmedAt` 결측 건수를 한 번 세야 한다. 이 세션에서는 운영 DB 접근을 하지 않았다. 0건이면 아무것도 안 해도 되지만, 확인 없이 배포하면 매출 카드가 조용히 작은 값을 보여준다.
2. **캐싱 정책** — `force-dynamic`이라 매 요청마다 4쿼리가 실행된다. 대시보드 지표는 초 단위 신선도가 불필요하므로 `unstable_cache` + `revalidate: 60` 같은 완화가 가능하지만, REQ-1의 "등록·주문 발생 시 값이 갱신된다"와의 허용 지연을 정해야 한다. **본 설계는 캐싱 없음을 기본으로 둔다**(요구사항을 문자 그대로 만족). 쿼리 4개 전부 인덱스 커버(A/B/C 반영 시)라 현 규모에선 캐싱 없이도 충분하다.
3. **인덱스 B/C 채택 여부** — A는 필수라 이 기능에 포함한다. B(Product)는 이 기능과 무관하게도 Product에 인덱스가 하나도 없는 상태를 개선하지만, 스코프 확대로 볼 수 있어 별도 Issue로 뺄지 판단이 필요하다. C(User)는 이번엔 빼도 무방하다.
4. **soft delete 컨벤션 통일** — Product `deletedAt` vs User `isDelete` 불일치는 이 기능 스코프 밖이다(전 문서 backfill + 기존 쿼리 전수 수정 필요). 별도 Issue 등록 권고.
5. **`/admin/orders` 실데이터 전환(별도 Issue 후보)** — 여전히 `MOCK_ORDERS` 기반이라 ui-designer가 최근 주문 카드에 단 "전체 보기" 링크가 mock 화면으로 간다. 이번 스코프 밖이지만 **DB 관점에서 선행 조건이 이미 충족된다** — §3-A의 `{ createdAt: -1 }` 인덱스가 관리자 전역 주문 목록(userId 스코프 없음 + createdAt 커서 페이징)을 그대로 커버한다. 그쪽 작업 시 인덱스 추가가 다시 필요하지 않다.
