# 01 — UI 설계: admin 대시보드 실데이터 연결

> 대상 라우트: `src/app/(admin)/admin/dashboard/page.tsx`
> 도달 URL: **`/admin/dashboard`** — `(admin)` 라우트 그룹은 URL에서 제거된다. 파일 경로는 `(admin)/admin/dashboard/`지만 실제 URL 세그먼트는 `/admin/dashboard` 하나뿐이다(그룹 `(admin)` 소멸, 폴더 `admin` 유지).
> 상태: **확정.** api-designer·db-migrator와 3자 합의 완료(1라운드), 미해결 쟁점 없음 — §7 참고.

---

## 1. 전제: 이 화면에는 클라이언트 상태 머신이 없다

`page.tsx`가 `export const dynamic = "force-dynamic"` async Server Component다. 그래서:

- 로딩 스피너·`useSWR`·`useState` 기반 상태 전이가 **존재하지 않는다.** 데이터는 SSR 렌더 시점에 단 한 번 확정된다.
- fetch 실패는 클라이언트 에러 상태가 아니라 **throw → `src/app/(admin)/error.tsx`**(`ErrorFallback`, `backPath={routes.admin.dashboard}`)가 페이지 전체를 대체한다.
- 따라서 아래 §5의 "상태 전이표"는 클라이언트 전이가 아니라 **렌더 시점 분기표**다. boundary-verifier는 이 표를 "서버 데이터 값 → 렌더 결과" 대조 기준으로 쓴다.

이 전제가 깨지는 유일한 경우는 "새로고침 버튼"·"기간 필터" 같은 인터랙션이 추가될 때다. 이번 요구사항(REQ-1/REQ-2)에 그런 항목이 없으므로 **클라이언트 컴포넌트를 하나도 만들지 않는다.**

---

## 2. 화면 플로우

```
[관리자 로그인 상태]
      │
      │ 사이드바 "대시보드" 클릭 또는 /admin/dashboard 직접 진입
      ▼
proxy.ts (낙관적 체크) ─── 미인증/비ADMIN ──▶ 로그인/홈으로 리다이렉트
      │
      ▼
page.tsx: await verifySession("ADMIN")   ← 실질 보안 경계
      │
      ├── 실패 ────────────────────────▶ redirect (기존 동작 유지)
      ▼
page.tsx: await getDashboardStatsService()
      │
      ├── throw ───────────────────────▶ (admin)/error.tsx 전체 대체 [상태 E]
      ▼
<AdminDashboardTemplate stats={...} /> 렌더
      │
      ├─ 통계 카드 4개            → 값은 항상 렌더(0도 유효값) [상태 A]
      │                             trend만 조건부 [상태 B / C]
      └─ 최근 주문 카드           → 1건 이상 [상태 A] / 0건 [상태 D]
      │
      ▼
[종료] 관리자가 값을 읽고 "전체 보기" → /admin/orders 로 이탈하거나 사이드바로 이동
```

진입점은 사이드바(`SidebarNavItem type="ADMIN"`)와 `(admin)/error.tsx`의 "관리자 대시보드로" 버튼 두 곳. 이 화면에는 폼이 없다 → **폼 유효성 규칙 없음**(`src/core/schemas/request/` 재사용 대상 없음).

---

## 3. 컴포넌트 트리 (확정)

```
src/app/(admin)/admin/dashboard/
├── page.tsx                          [수정] Server Component
│    └─ verifySession("ADMIN") → getDashboardStatsService() → Template에 props 전달만
└── _components/                      [신규 폴더]
     ├── index.tsx                    [신규] 배럴 — AdminDashboardTemplate만 재export
     ├── AdminDashboardTemplate.tsx   [신규] 순수. props: { stats: DashboardStats }
     │    ├── TypographyMuted                          (atom, 기존)  인사 문구
     │    ├── <section className="grid ...">           배치 코드 — 기존 클래스 그대로
     │    │    └── statCards.map()  ×4
     │    │         └── Card / CardHeader / CardTitle / CardContent   (atoms, 기존)
     │    │              ├── lucide icon: Package · DollarSign · ShoppingCart · Users
     │    │              ├── value    <div className="text-2xl font-bold">
     │    │              ├── TypographyMuted (description)
     │    │              └── TypographySmall (trend) ← 조건부 렌더, §5 상태 C
     │    └── <RecentOrdersCard orders={stats.recentOrders} />
     └── RecentOrdersCard.tsx         [신규] 순수. props: { orders: DashboardRecentOrder[] }
          └── Card / CardHeader / CardTitle / CardContent            (atoms, 기존)
               ├── CardHeader: 제목 + <Link href={routes.admin.orders}>전체 보기</Link>
               ├── <div className="overflow-x-auto"> <table> …        (마크업 인라인)
               │    └── 행마다 Badge(atom, 기존) + ORDER_STATUS_* lookup
               └── 빈 상태 블록 ← §5 상태 D
```

### 3.1 왜 Template을 새로 만드는가 (필수)

`src/app/AGENTS.md`: "organism을 배치(grid/flex/spacing 등)하는 코드가 하나라도 있으면 Template 추출이 필수다." 현재 `page.tsx`에 `space-y-8`, `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`가 있으므로 예외("organism 1개를 배치 코드 없이 렌더")에 해당하지 않는다 → 추출이 강제된다.

**위치는 `src/ui/components/templates/`가 아니라 라우트 로컬 `_components/`다.** `templates/AGENTS.md`: 공용 승격은 "2곳 이상의 라우트가 의도적으로 동일한 전체 배치를 공유할 때만". 소비 라우트가 `/admin/dashboard` 하나뿐이므로 로컬에 머문다. `(admin)/admin/orders/_components/AdminOrdersTemplate.tsx`와 동일 선례.

### 3.2 왜 `RecentOrdersCard`만 쪼개고 `StatCard`는 안 쪼개는가 (과잉 생성 방지)

| 후보 | 판정 | 근거 |
|---|---|---|
| `RecentOrdersCard` | **분리** | 테이블 마크업 + 배지 lookup + 빈 상태 분기까지 묶인 독립 구획(section)이다. Template 안에 인라인하면 Template이 배치 책임을 넘어 콘텐츠 렌더 책임까지 떠안는다. |
| `DashboardStatCard` | **분리 안 함** | 현재도 `stats.map()` 안에 인라인된 15줄짜리 JSX다. 쪼개봐야 얻는 게 "15줄 이동"뿐이고, 소비처는 이 Template 하나다. 인라인 유지 = 기존 코드와 최소 diff. |
| `_utils/` VM 빌더 | **만들지 않음** | 4개 카드 배열은 Template 안에서 인라인 선언한다. 재사용 가능한 포맷 함수만 `src/core/utils/`로 뺀다(§3.3). Template `.test.tsx` 렌더 테스트로 충분히 커버된다(`AdminProductsTemplate.test.tsx` 선례). |
| `_types/` | **만들지 않음** | 화면 전용 VM 타입이 없다. Template은 `@/core/domain`의 `DashboardStats`를 그대로 받는다. |

> 결론: **신규 파일 3개**(`index.tsx`, `AdminDashboardTemplate.tsx`, `RecentOrdersCard.tsx`) + `src/core/utils/` 함수 2개. 그 외 신규 컴포넌트 없음.

### 3.3 `src/core/utils/`에 추가가 필요한 순수 함수 2개

두 함수 모두 **도메인/라우트 이름을 담지 않는다**(`src/AGENTS.md`: `{목적}` 기반 파일에 도메인명 금지).

| 함수 | 위치 | 시그니처 | 왜 필요한가 |
|---|---|---|---|
| `formatSignedPercent` | `src/core/utils/percent.ts` (신규 파일) | `(current: number, previous: number) => { label: string; direction: "up" \| "down" \| "flat" } \| null` | 전월 대비 증감률. `previous === 0`이면 `null` 반환(0 나눗셈 → "+∞%" 방지). 부호/방향을 **문자열이 아니라 구조체로** 반환해야 UI가 색상을 판정할 수 있다. |
| `formatRelativeTime` | `src/core/utils/date.ts` (기존 파일에 추가) | `(date: Date, now?: Date) => string` | 최근 주문의 "3시간 전". 기존 `getTimeDiff`는 `Math.max(diff, 0)`로 **미래 시각만** 다뤄서(결혼식 카운트다운 전용) 과거 시각에 재사용 불가 — 그래서 신규가 불가피하다. |

`formatRelativeTime` 구간: `<1분` → "방금 전", `<60분` → "N분 전", `<24시간` → "N시간 전", `<7일` → "N일 전", 그 이상 → 기존 `formatDate(date, "dot")`("2026.8.20").

> **SSR 안전성**: 상대시간을 서버에서 계산해도 hydration mismatch가 없다. 이 트리에 클라이언트 컴포넌트가 하나도 없어서(§1) 브라우저가 이 값을 다시 렌더하지 않는다. 오히려 절대시각보다 안전하다 — 절대시각은 서버 타임존으로 굳어 사용자 타임존과 어긋나지만, 상대시간은 두 시각의 **차이**만 쓰므로 타임존 무관이다.

> ⚠️ **`<7일` 분기만 타임존 무관이고, 그 이상 폴백 분기는 아니다.** 폴백이 호출하는 기존 `formatDate(date, "dot")`는 `getFullYear()`/`getMonth()`/`getDate()`를 쓰므로 **서버 로컬 타임존**(Vercel = UTC)으로 렌더된다. KST 밤 9시 주문이 UTC로는 전날 낮이라 하루 밀린 날짜가 찍힌다. Q11에 따라 `date-fns-tz`가 이미 의존성으로 들어오므로, **`formatRelativeTime`의 폴백 분기는 `Asia/Seoul`로 명시 포맷한다** — 카드 숫자(KST 월 경계)와 리스트 날짜가 서로 다른 타임존을 쓰는 상황을 애초에 안 만든다. 기존 `formatDate` 자체는 건드리지 않는다(소비처 전역 영향, 스코프 밖).

### 3.4 재사용하는 기존 자산 (신규 제작 금지 목록)

| 자산 | 경로 | 용도 |
|---|---|---|
| `Card` `CardHeader` `CardTitle` `CardContent` | `@/ui/components/atoms` | 카드 5개 전부 |
| `Badge` | `@/ui/components/atoms` | 최근 주문 상태 배지 |
| `TypographyMuted` `TypographySmall` | `@/ui/components/atoms` | description / trend / 빈 상태 문구 |
| `ORDER_STATUS_LABELS` `ORDER_STATUS_BADGE_VARIANTS` | `@/core/domain` (`order.ts`) | 상태 라벨·배지 variant — **재정의 금지** |
| `formatPriceWithComma` | `@/core/utils` (`price.ts`) | 매출/금액 통화 포맷 |
| `routes.admin.orders` | `@/core/domain` (`routes.ts`) | "전체 보기" 링크 — 경로 문자열 하드코딩 금지 |
| 테이블 마크업 패턴 | `(admin)/admin/orders/_components/AdminOrdersTemplate.tsx` L62–99 | 컬럼 구성·`overflow-x-auto`·빈 상태 블록을 시각적으로 그대로 맞춘다(컴포넌트 import가 아니라 **패턴 참조**) |

---

## 4. 필드 매핑 — 화면 슬롯 ↔ 데이터 출처

Template이 받는 prop은 `stats: DashboardStats`(`@/core/domain/dashboard.ts`) 하나다.

### 4.1 통계 카드 4개

| # | title | icon | value | description | trend |
|---|---|---|---|---|---|
| 1 | 등록 상품 | `Package` | `stats.totalProducts.toLocaleString()` | 삭제 제외 전체 상품 | `stats.productsCreatedThisMonth` → `+N개 이번 달` (direction: `up` if >0) |
| 2 | 총 매출 | `DollarSign` | `₩${formatPriceWithComma(stats.revenueThisMonth)}` | 이번 달 결제 완료 기준 | `formatSignedPercent(revenueThisMonth, revenuePreviousMonth)` → `+12.5% 지난 달 대비` |
| 3 | 결제 주문 | `ShoppingCart` | `stats.paidOrderCountThisMonth.toLocaleString()` | 이번 달 결제 완료 주문 | `formatSignedPercent(paidOrderCountThisMonth, paidOrderCountPreviousMonth)` → `-8.0% 지난 달 대비` |
| 4 | 활동 회원 | `Users` | `stats.totalUsers.toLocaleString()` | 탈퇴 제외 가입 회원 | `stats.usersCreatedThisMonth` → `+N명 이번 달` (direction: `up` if >0) |

#### 4.1.1 title/description 문구를 바꾼 근거 (db-migrator 스키마 확인 결과 반영)

기존 mock 문구는 집계 조건과 어긋나 있었다. 화면 문구는 실제 쿼리 조건과 1:1로 맞춘다 — 안 맞으면 관리자가 숫자를 오독한다.

| 카드 | 기존 → 변경 | 근거 |
|---|---|---|
| 1 | `총 상품` / `등록된 템플릿 수` → `등록 상품` / `삭제 제외 전체 상품` | 집계 조건이 `{ deletedAt: null }` 하나라 **비공개(`inactive`)·품절(`soldOut`)도 포함**된다. "총"은 전수로, "템플릿"은 청첩장 한정으로 읽혀 둘 다 실제보다 좁거나 넓다. `status`로 추가 필터링하지 않기로 한 건 admin 상품 목록 화면 숫자와 어긋나지 않게 하기 위해서다. |
| 2 | `이번 달 매출` → `이번 달 결제 완료 기준` | 집계 기준이 `Order.createdAt`이 아니라 **`confirmedAt`(결제 확정 시각)**이다. 가상계좌 주문은 생성월과 입금월이 갈릴 수 있어, 주문만 넣고 미입금인 건은 이 숫자에 안 잡힌다. 그 사실을 description이 드러내야 한다. |
| 3 | `주문` / `이번 달 주문 수` → `결제 주문` / `이번 달 결제 완료 주문` | 모집단을 매출 카드와 동일하게 `CONFIRMED`/`COMPLETED` + `confirmedAt` 기준으로 통일한다(db-migrator·api-designer 독립 합의, **수용**). 전체 주문을 세면 자동취소 예정인 방치 `PENDING`이 카운트를 부풀리고, 무엇보다 **옆 카드와 모집단이 달라 "매출 ÷ 주문수 = 객단가"가 성립하지 않는다** — 나란히 놓인 두 카드가 암묵적으로 약속하는 관계가 깨진다. |
| 4 | `총 회원` / `총 회원 수` → `활동 회원` / `탈퇴 제외 가입 회원` | 집계 조건이 `{ isDelete: false }`라 탈퇴 회원이 빠진다. "총 회원"은 탈퇴 포함으로 읽힌다. |

#### 4.1.2 trend 종류가 카드마다 다른 근거 — 저량/유량 구분 (api-designer 합의)

비대칭은 일관성 결여가 아니라 **지표 종류가 실제로 두 가지**라서다. frontend-impl은 이 구분을 지우고 통일하려 들지 말 것.

| 종류 | 카드 | value의 의미 | trend 형태 | 왜 |
|---|---|---|---|---|
| **저량(stock)** | 1 등록 상품, 4 활동 회원 | 시점 누적 총계 | 이번 달 증가 **절대 건수** (`+N개` / `+N명`) | 누적 총계에 전월 대비 %를 씌우면 분모가 커서 항상 작은 양수가 나온다 — 변화를 못 보여준다 |
| **유량(flow)** | 2 총 매출, 3 결제 주문 | 이미 한 달치 양 | **전월 대비 %** | 같은 길이 구간끼리의 비교라 %가 의미를 가진다 |

> mock의 주문 trend `"+8 지난 주 대비"`는 혼자만 **주 단위**였다. 계승하지 않는다 — 4개 카드 전부 월 단위로 통일한다.

**trend 종류가 카드마다 다른 것은 의도다.** 1·4번은 "누적 총계 + 이번 달 절대 증가분"이라 전월 대비 %가 의미를 만들지 않는다(총 회원은 정의상 단조 증가 → 항상 +%). 2·3번은 "이번 달 값"이라 전월과 비교해야 의미가 생긴다. 그래서 응답 shape의 필드 구성이 카드마다 비대칭인 게 맞다.

**trend 색상**(현재 코드는 무조건 `text-primary` — 감소를 긍정색으로 칠하는 버그가 있다):

| direction | 클래스 |
|---|---|
| `up` | `text-primary` |
| `down` | `text-destructive` |
| `flat` | `text-muted-foreground` |

### 4.2 최근 주문 테이블 (`RecentOrdersCard`)

컬럼 순서는 `/admin/orders`와 앞 5개를 일치시키고 시간만 끝에 덧붙인다 — 두 화면을 오갈 때 눈이 다시 적응할 필요가 없게.

| 컬럼 | 정렬 | 소스 필드 | 렌더 |
|---|---|---|---|
| 주문번호 | left | `order.merchantUid` | 그대로 (행 `key`도 이 값) |
| 고객명 | left | `order.buyerName` | 그대로 |
| 상품 | left | `order.productTitle` | `truncate max-w-[16rem]` — 상품명이 길면 테이블이 밀린다 |
| 상태 | left | `order.orderStatus` | `<Badge variant={ORDER_STATUS_BADGE_VARIANTS[s]}>{ORDER_STATUS_LABELS[s]}</Badge>` |
| 금액 | right | `order.finalPrice` | `${formatPriceWithComma(v)}원` |
| 시간 | right | `order.createdAt` | `formatRelativeTime(v)`, `text-muted-foreground` |

**카드 제목은 "최근 활동"이 아니라 "최근 주문"으로 바꾼다.** 내용이 주문만 담는데 제목이 "활동"이면, 다음 사람이 그 불일치를 "신규 가입·신규 상품도 넣어야 한다"는 신호로 읽는다. REQ-2가 "실제 최근 활동(주문 등, **설계 단계에서 확정**)"으로 위임했으므로 이 범위 안이다.

**통합 액티비티 피드(주문+가입+상품 혼합)를 채택하지 않은 이유**: 이종 이벤트를 한 타임라인에 합치려면 (a) 세 컬렉션을 시간순 병합하는 집계, (b) 이벤트 종류별 서로 다른 행 렌더러, (c) 종류 필터 UI가 따라온다. 현재 관리자가 대시보드에서 실제로 확인하려는 건 "돈이 들어왔는가"이고 나머지 둘은 이미 카드 trend(신규 상품 N개 / 신규 회원 N명)로 요약돼 있다. 지금 근거로는 비용 대비 이득이 없다 — 필요해지면 그때 별도 Issue로 확장한다.

---

## 5. 렌더 분기표 (= 이 화면의 "상태 전이표")

클라이언트 전이가 아니라 **서버 데이터 값 → 렌더 결과** 매핑이다. boundary-verifier는 이 표를 대조 기준으로 쓴다.

| 상태 | 트리거 조건 | 렌더 결과 | 다음 상태 |
|---|---|---|---|
| **A. 정상** | `getDashboardStatsService()` 성공 + `recentOrders.length > 0` | 카드 4개 값 + trend, 테이블 5행 | (종료) 재진입/새로고침 시 A~E 재평가 |
| **B. 값 0** | 어떤 스칼라든 `0` (예: `revenueThisMonth === 0`) | `"₩0"` / `"0"`을 **그대로 렌더**한다. `-`·`—`·빈칸·"데이터 없음"으로 대체하지 않는다 — 0은 유효한 집계 결과다 | A와 동일 |
| **C. trend 계산 불가** | ① `revenuePreviousMonth === 0` 또는 `paidOrderCountPreviousMonth === 0` → `formatSignedPercent`가 `null` 반환 <br> ② `productsCreatedThisMonth === 0` 또는 `usersCreatedThisMonth === 0` | **`TypographySmall` 줄을 통째로 렌더하지 않는다.** 빈 문자열로 자리만 남기지 않는다. 카드 높이 차이는 CSS grid 기본 `align-items: stretch`가 흡수한다(별도 `h-full` 불필요; 시각적으로 무너지면 `Card`에 `h-full` 추가) | A와 동일 |
| **D. 최근 주문 없음** | `recentOrders.length === 0` | `<table>` 대신 카드 본문에 중앙 정렬 빈 상태: <br>제목 `아직 주문이 없습니다` (`text-sm font-medium`) <br>보조 `첫 주문이 들어오면 여기에 표시됩니다.` (`TypographyMuted`) <br>`flex flex-col items-center gap-1 py-12 text-center` — `AdminOrdersTemplate` L94–99 패턴, Card 안이라 `py-16`→`py-12` | A와 동일. **통계 카드 4개는 정상 렌더된다** — D는 카드 섹션에 영향 없음 |
| **E. 조회 실패** | 서비스가 throw (DB 커넥션·집계 오류 등) | `page.tsx`에서 예외 전파 → `(admin)/error.tsx`의 `ErrorFallback`이 **페이지 전체 대체**. 부분 렌더 없음 | 사용자가 `unstable_retry()` → A~E 재평가 |
| **F. 비인가** | `verifySession("ADMIN")` 실패 | 기존 동작 그대로(리다이렉트). 이번 기능이 건드리지 않는다 | — |

### 5.1 상태 B·C는 예외 처리가 아니라 **상시 경로**다 (db-migrator 확인)

frontend-impl이 "0 나눗셈 방어" 정도로 읽고 대충 넘기면 안 된다. 실제로 자주 밟는다:

- Q1 aggregation은 해당 월에 결제 완료 주문이 **없으면 버킷 행 자체를 안 내놓고**, 서비스가 `?? 0`으로 채운다. 즉 `revenuePreviousMonth === 0`은 오류가 아니라 **정상 산출값**이다.
- 서비스 오픈 첫 달에는 상태 B·C·D가 **동시에** 성립한다(매출 0, 전월 0, 주문 0건). 지금 이 프로젝트 상태가 정확히 그렇다 — 즉 **이 기능을 머지한 직후 관리자가 처음 보게 될 화면이 상태 C+D 조합이다.** 상태 A가 아니라.
- 그래서 Template 테스트는 A만 통과시키면 안 되고 **B·C·D를 각각 케이스로 넣어야 한다**(§8 체크리스트).

이게 §3.3에서 `formatSignedPercent`의 반환 타입을 `string`이 아니라 `{ label, direction } | null`로 잡은 실질적 이유다 — `null`이 드문 예외가 아니라 초기 몇 달간 기본값에 가깝다.

### 5.2 상태 E를 all-or-nothing으로 두는 이유

"통계는 나왔는데 최근 주문만 실패" 같은 부분 실패를 **허용하지 않는다.** 대시보드는 관리자가 숫자를 보고 판단하는 화면이라, 일부 섹션만 비어 있으면 "0이라서 빈 건지, 못 불러온 건지"를 화면만 보고 구분할 수 없다 — 그 모호함이 상태 B(값 0)와 정면으로 충돌한다. 전부 나오거나 전부 에러 화면이 낫다. 초안 서비스의 `Promise.all`(하나 reject → 전체 reject)이 이 정책과 이미 일치한다.

---

## 6. `page.tsx` 최종 형태 (계약)

```
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await verifySession("ADMIN");
  const stats = await getDashboardStatsService();
  return <AdminDashboardTemplate stats={stats} />;
}
```

- `page.tsx`에 배치 코드(`grid`/`space-y-*`)·상수 배열·포맷 로직이 **하나도 남지 않는다** → `src/app/AGENTS.md`의 "Pages 단계만 담당" 충족.
- organism 1개(=Template)를 배치 코드 없이 그대로 렌더 → 예외 조항 충족.
- `verifySession`과 `getDashboardStatsService`를 **순차 await**한다(`Promise.all` 아님) — 인가 실패 시 DB 집계를 애초에 돌리지 않기 위해서다.

---

## 7. 3자 협상 결과 — 전 항목 확정

**미해결 쟁점 없음.** api-designer·db-migrator와 1라운드에 전부 합의됐다.

| # | 항목 | 확정 내용 | 출처 |
|---|---|---|---|
| Q1 | 데이터 경로 | **`page.tsx`가 `getDashboardStatsService()`를 직접 import + await.** route handler·`useSWR`·`fetcher` 전부 없음. `docs/architecture/data-access.md` row 1("서버 렌더 시점 데이터 → `src/services/*` 직접 호출, 같은 프로세스 안에서 HTTP 왕복 안 만듦") 근거. UI가 소비하는 계약은 HTTP JSON이 아니라 **함수 리턴 타입 `DashboardStats`** | api-designer |
| Q2 | `createdAt` 타입 | **`Date` 객체 확정.** JSON 경계를 안 타므로 string 될 일 없다. `OrderJSON.createdAt`과도 일관 | api-designer |
| Q3 | trend 원시 수치 | **채택.** 완성 문구는 안 내려온다, 전부 raw number. 부호·색상·포맷은 UI 소관 | api-designer |
| Q4 | `null` 아닌 실제 `0` | **채택. 그리고 "집계 못 함" 상태는 아예 존재하지 않는다** — Q6의 all-or-nothing 때문에 집계 실패는 값이 아니라 throw로 나간다. **0이 내려오면 언제나 진짜 0이다** | api-designer |
| Q5 | 최근 주문 5건 | **채택.** 이견 없음 | api-designer |
| Q6 | 부분 실패 불허 | **채택.** `Promise.all` 유지, 실패 시 `AppError` → `(admin)/error.tsx` 통째 대체. per-section 폴백 설계하지 않는다 | api-designer |
| Q7 | 매출 집계 기준 | **`CONFIRMED`+`COMPLETED`, `createdAt`이 아니라 `confirmedAt`(결제 확정 시각) 기준.** 가상계좌는 생성월≠입금월이라 `createdAt` 기준이면 "이번 달 매출"이 실제 입금과 어긋난다. `{ orderStatus: 1, confirmedAt: 1 }` 복합 인덱스가 이미 있어 커버됨 → **UI 조치: description을 "이번 달 결제 완료 기준"으로**(§4.1.1) | db-migrator |
| Q8 | soft delete 판별 | `Product`는 `{ deletedAt: null }`(nullable, default 존재), `User`는 `{ isDelete: false }`(`deletedAt` 필드 없음). 규칙이 서로 다른 게 현재 실상이고 통일은 이 스코프 밖 → **UI 조치: 카드 문구를 "등록 상품"/"활동 회원"으로**(§4.1.1) | db-migrator |
| Q9 | 주문 카드 모집단 통일 + **필드명 규칙 통일** | **수용.** 8개 스칼라 전부 `{지표}{ThisMonth\|PreviousMonth}` 한 규칙으로 통일한다 — 초안은 `monthly*`/`previousMonth*`/`*ThisMonth` 3종이 섞여 있었다. 리네이밍 4건은 §7.2 표 참고 | api-designer + db-migrator |
| Q10 | 최근 주문 정렬·필터 | **상태 필터 없이 `createdAt` desc.** `PENDING`/`CANCELLED`도 포함된다 — 여기만 `confirmedAt`을 안 쓴다(PENDING은 `confirmedAt`이 없어 통째로 사라짐). 취소·대기 건이 보이는 게 관리자에겐 정보고, 상태는 배지가 말해준다 | db-migrator + api-designer |
| Q11 | 월 경계 타임존 | **KST(Asia/Seoul) 기준으로 집계.** 초안은 서버 로컬 TZ(Vercel=UTC)라 9시간 어긋났다. `date-fns-tz`가 의존성으로 들어온다 → §3.3의 UI 조치 참고 | api-designer |
| Q12 | `productTitle` 출처 | Order 문서의 **주문 시점 스냅샷**(Product join 아님). 상품명이 바뀌거나 상품이 삭제돼도 주문 당시 이름이 남는다 → **삭제된 상품의 주문이 리스트에 떠도 정상이다.** UI가 "상품 없음" 폴백을 만들 필요 없음 | db-migrator |
| Q13 | `orderId`(_id) 필드 추가 | **추가 안 함.** admin에 `[orderId]` 상세 라우트가 없어 링크 걸 곳이 없다. 행 key는 `merchantUid`(unique 인덱스) 사용 | api-designer |
| Q14 | `confirmedAt` 결측 (**UI 영향 있음**) | 2026-07-29 PR #77 이전 결제 건에 `confirmedAt` 필드가 없는 게 **실재하는 결함으로 확정**됐다. 리턴 타입은 안 바뀌지만, backfill 없이 구현하면 매출·결제주문 카드가 **에러 없이 조용히 작은 숫자를 렌더한다** — 상태 B(값 0은 진짜 0)와 구분이 안 되는 가짜 값이라 이 화면에서 제일 위험한 실패 양상이다. backend-impl이 구현 전 backfill 선행 | api-designer + db-migrator |
| Q15 | 집계 상한 | `getKstMonthRange`가 경계 3개(전월/이번달/다음달)를 반환하고 상한을 `now`가 아닌 `startOfNextMonth`로 고정한다. **UI 영향 없음** | api-designer + db-migrator |

### 7.1 확정된 `DashboardStats` (UI가 소비하는 최종 shape)

```ts
interface DashboardStats {
  totalProducts: number;                  // deletedAt: null
  productsCreatedThisMonth: number;
  totalUsers: number;                     // isDelete: false
  usersCreatedThisMonth: number;
  revenueThisMonth: number;               // CONFIRMED+COMPLETED, confirmedAt 기준, KST 월 경계
  revenuePreviousMonth: number;
  paidOrderCountThisMonth: number;        // CONFIRMED+COMPLETED, confirmedAt 기준
  paidOrderCountPreviousMonth: number;
  recentOrders: DashboardRecentOrder[];   // createdAt desc, 5건, 상태 무필터
}

interface DashboardRecentOrder {
  merchantUid: string;
  buyerName: string;
  productTitle: string;
  finalPrice: number;
  orderStatus: OrderStatus;
  createdAt: Date;
}
```

### 7.2 초안 대비 리네이밍 4건 — backend-impl 선행 작업

초안 `src/core/domain/dashboard.ts`(uncommitted)는 아직 구 이름을 들고 있다. **Template을 붙이기 전에 리네이밍이 선행돼야 한다.**

| 초안 필드명 | 확정 필드명 | 소비 위치 |
|---|---|---|
| `monthlyRevenue` | `revenueThisMonth` | §4.1 카드 2 value |
| `previousMonthRevenue` | `revenuePreviousMonth` | §4.1 카드 2 trend |
| `monthlyOrderCount` | `paidOrderCountThisMonth` | §4.1 카드 3 value |
| `previousMonthOrderCount` | `paidOrderCountPreviousMonth` | §4.1 카드 3 trend |

나머지 4개(`totalProducts`, `productsCreatedThisMonth`, `totalUsers`, `usersCreatedThisMonth`)와 `recentOrders`는 초안 그대로다.

> **boundary-verifier 대조 지점 3곳**
> 1. `dashboard.ts`의 8개 스칼라 필드명 ↔ `AdminDashboardTemplate`이 실제로 읽는 필드명(§4.1)이 정확히 일치하는가. 리네이밍 누락 시 타입 에러로 잡히지만, 초안이 uncommitted라 "이미 맞다"고 착각하기 쉽다.
> 2. **카드는 `confirmedAt` 기준, 리스트는 `createdAt` 기준으로 서로 다른 게 의도다**(§7 Q7·Q10). 불일치로 판정하지 말 것 — 두 지표가 답하는 질문이 다르다(입금 총량 vs 유입 현황). db-migrator 문서 §2 Q2 아래 주의 블록에 같은 내용이 있으니 교차 확인 가능.
> 3. 월 경계 타임존이 카드(집계, KST)와 리스트(`formatRelativeTime` 폴백, KST)에서 동일한가(§3.3 ⚠️).
> 4. `confirmedAt` backfill이 구현보다 **먼저** 끝났는가(§7 Q14). 이건 화면만 봐서는 절대 못 잡는다 — 숫자가 그럴듯하게 작게 나올 뿐 에러가 안 난다.

---

## 8. 구현자(frontend-impl)를 위한 체크리스트

- [ ] `_components/` 폴더 + `index.tsx` 배럴 생성 — 파일 1개여도 배럴 형태 유지(`src/app/AGENTS.md`). 배럴은 `page.tsx`가 직접 import하는 `AdminDashboardTemplate`만 재export하면 된다(`RecentOrdersCard`는 Template 내부 전용이라 배럴에 안 올려도 됨).
- [ ] `page.tsx`/`layout.tsx` 외에는 `export default` 금지 — Template·Card 둘 다 named export(`export { AdminDashboardTemplate }`).
- [ ] `"use client"` 붙이지 않는다 — 이 트리 전체가 Server Component다(§1).
- [ ] `ORDER_STATUS_LABELS`/`ORDER_STATUS_BADGE_VARIANTS`를 로컬에 다시 선언하지 않는다 — `@/core/domain` 배럴에서 import.
- [ ] "전체 보기"는 `useRouter().push()`가 아니라 `next/link`의 `<Link href={routes.admin.orders}>` — 이래야 Template이 순수한 채로 남는다(`components/AGENTS.md` 예외 2).
- [ ] 상태 B: 값이 0일 때 falsy 단축(`value || "-"`)을 쓰지 않는다. 이 한 줄이 §5 상태 B를 정면으로 깬다.
- [ ] 상태 C: `trend && <TypographySmall>` 형태로 **줄 자체를 생략**한다. `trend ?? ""`로 빈 문자열 렌더 금지.
- [ ] `formatSignedPercent` / `formatRelativeTime`은 `src/core/utils/`에 두고 배럴(`index.ts`)에 `export *` 추가. 각각 `.test.ts` 동반(경계값: `previous === 0`, 음수 증감, 정확히 60분/24시간/7일).
- [ ] `formatRelativeTime`의 `>7일` 폴백은 `Asia/Seoul` 고정 포맷 — 기존 `formatDate`를 그대로 호출하면 UTC로 새 날짜가 찍힌다(§3.3 ⚠️).
- [ ] 초안 `src/core/domain/dashboard.ts`의 **리네이밍 4건(§7.2)이 끝난 뒤에** Template을 붙인다. 8개 스칼라가 `{지표}{ThisMonth|PreviousMonth}` 한 규칙으로 통일돼야 한다.
- [ ] 카드 4개의 title/description은 §4.1.1의 변경 문구를 쓴다 — mock 문구(`총 상품`/`등록된 템플릿 수`/`총 회원`/`이번 달 주문 수`)를 그대로 옮기면 실제 집계 조건과 어긋난다.
- [ ] Template `.test.tsx`로 §5의 A~D를 렌더 검증(`AdminProductsTemplate.test.tsx` 패턴). **A만 테스트하고 끝내지 말 것** — 머지 직후 관리자가 실제로 보게 될 화면은 A가 아니라 **C+D 조합(전 지표 0, 주문 0건)**이다(§5.1). 최소 케이스: ① 정상 A ② 전월 0 → trend 줄 부재 확인 ③ `recentOrders: []` → 빈 상태 문구 + 카드 4개는 정상 렌더 ④ 오픈 첫 달(전부 0) 통합 케이스.

### 8.1 이번 스코프 밖(별도 Issue 후보)

- `formatPriceWithComma`가 사실상 범용 콤마 포맷터인데 이름이 `price` 도메인에 묶여 있다 — 그래서 이번 설계에서 개수(상품/주문/회원)는 `.toLocaleString()`을, 통화(매출/금액)는 `formatPriceWithComma`를 쓰는 이원화가 남는다. 리네이밍은 소비처 전체를 건드리므로 이 브랜치에서 하지 않는다.
- `(admin)/admin/orders`는 여전히 `MOCK_ORDERS` 기반이다. 대시보드 "전체 보기" 링크가 mock 화면으로 간다는 불일치가 남지만, 주문 전체조회 API는 이번 요구사항 밖이다.
