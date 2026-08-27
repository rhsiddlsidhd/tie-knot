# 04 — 테스트 리포트: admin 대시보드 실데이터 연결

> 작성: test-suite (Phase 4)
> 대상 브랜치: `feat/admin-dashboard-real-data` (워크트리 아님, 표준 브랜치에 직접 작업)

---

## 1. 착수 전 커버리지 파악 — 무엇이 이미 덮여 있었는가

`04_integration_report.md`와 기존 테스트 파일을 먼저 읽고 확인한 결과:

| 계층 | 파일 | 케이스 수 | 커버 범위 |
|---|---|---|---|
| Service | `src/services/dashboard.integration.test.ts` | 11 | `getDashboardStatsService`의 DB 집계 로직(저량/유량 지표, KST 월 경계, soft delete 필터, `confirmedAt` 기준 매출, `recentOrders` 정렬/개수, 에러 래핑) |
| Template | `src/app/(admin)/admin/dashboard/_components/AdminDashboardTemplate.test.tsx` | 4 | 순수 렌더 계약(상태 A 정상, C trend 생략, D 빈 최근주문, C+D 오픈 첫 달 통합) |
| Auth | `src/services/auth.integration.test.ts` | — | `verifySession`의 redirect 계약(세션 없음/role 불일치/성공) 이미 촘촘히 커버 |

**빈 곳**: `page.tsx`가 이 세 계층을 실제로 올바르게 연결하는지 — DB → 실제 `getDashboardStatsService()` → `page.tsx` → `AdminDashboardTemplate`의 `stats` prop으로 데이터가 정확히 배선되는지, 그리고 `verifySession("ADMIN")`이 page.tsx에서 실제로 그 인자로 호출되고 실패 시 뒤 단계(DB 집계)를 건너뛰는지를 확인하는 테스트가 없었다. 이 경계가 이번 Phase 4의 대상이다.

---

## 2. 추가한 테스트

**신규 파일**: `src/app/(admin)/admin/dashboard/page.integration.test.ts` (4케이스)

기존 선례 `src/app/(main)/page.integration.test.ts`(홈 페이지 통합 테스트)와 `src/app/api/order/route.integration.test.ts`(route의 auth partial mock)의 패턴을 그대로 따랐다. `page.tsx`의 JSX는 함수 호출이 아니라 엘리먼트 서술자라 `await page()`가 반환한 엘리먼트의 `props`만 검사하면 하위 Template 바디는 실행되지 않는다 — 그래서 jsdom도 렌더링도 필요 없다(`@vitest-environment node`).

인증 경계는 `verifySession` 함수 자체를 다시 검증하지 않고 partial mock(`vi.mock("@/services", ...)`)으로 role만 제어 가능하게 대체했다 — 세션/쿠키/JWT 발급 메커니즘은 이 페이지의 검증 대상이 아니라는 `route.integration.test.ts`의 기존 원칙을 그대로 적용했다.

| # | 시나리오 | 검증 내용 |
|---|---|---|
| 1 | 골든패스 | 상품 1건(`createProductService`) + 결제 완료 주문 1건(`createOrderService` → `CONFIRMED`/`confirmedAt` 설정) + 회원 1건을 실제 DB에 시딩 → `page()` 호출 → `verifySession`이 정확히 `"ADMIN"` 인자로 호출됐는지, `getDashboardStatsService`가 1회 호출됐는지, 반환된 엘리먼트의 `props.stats`가 시딩한 실제 값(totalProducts, totalUsers, paidOrderCountThisMonth, revenueThisMonth, recentOrders 1건의 merchantUid)과 일치하는지 확인 |
| 2 | 빈 DB 상태(상태 C+D 조합) | `01_ui_flow.md` §5.1이 "머지 직후 관리자가 실제로 보게 될 화면"이라고 명시한 케이스 — DB에 아무것도 시딩하지 않고 `page()` 호출 → 8개 스칼라 전부 0, `recentOrders: []`가 예외 없이 `props.stats`로 전달되는지 `toEqual`로 전체 shape 검증 |
| 3 | 회귀: 비인가(role 불일치) | `role: "USER"`로 `page()` 호출 → `verifySession("ADMIN")`이 호출되고 reject되는지, 그 이후 단계인 `getDashboardStatsService`가 **호출되지 않는지**(`01_ui_flow.md` §6 "순차 await, `Promise.all` 아님" 계약의 실행 확인 — 인가 실패 시 DB 집계 자체가 안 돌아야 한다) |
| 4 | 회귀: 미인증 | `role: null`로 `page()` 호출 → `/login`으로의 redirect 계약이 유지되는지, `getDashboardStatsService` 미호출 확인 |

시나리오 3·4는 사용자 요청의 "가벼운 회귀 확인"에 해당한다 — `verifySession` 자체의 분기 로직은 `auth.integration.test.ts`가 이미 담당하므로, 여기서는 "page.tsx가 그 계약을 실제로 올바르게 소비하는가"만 확인했다.

### 발견한 버그
없음. 시나리오 3·4를 작성하며 `Promise.all`이 아닌 순차 `await` 계약이 실제로 지켜지고 있음을 확인했고(만약 `Promise.all`이었다면 `getDashboardStatsService` mock이 호출됐을 것), boundary-verifier가 이미 잡아낸 배선과 일치했다.

---

## 3. 테스트 인프라 변경

`vitest.config.ts`의 `integration` project `include` 목록에 신규 파일 경로를 1줄 추가했다(기존 `src/app/(main)/page.integration.test.ts`와 동일한 방식 — 이 프로젝트는 app 라우터 page 레벨 통합 테스트를 명시적 파일 단위 allowlist로 관리한다).

```diff
  "src/app/(main)/page.integration.test.ts",
  "src/app/(main)/_components/PopularProductsSection.integration.test.tsx",
+ "src/app/(admin)/admin/dashboard/page.integration.test.ts",
```

---

## 4. 실행 결과

### 4.1 신규 테스트 단독 실행
```
npx vitest run --project integration "src/app/(admin)/admin/dashboard/page.integration.test.ts"
Test Files  1 passed (1)
     Tests  4 passed (4)
```

### 4.2 전체 스위트 (2회 재현, 동일 결과)
```
npx vitest run
Test Files  3 failed | 138 passed (141)
     Tests  4 failed | 832 passed (836)
```

**실패 4건 — 전부 이 기능과 무관, `dev` 브랜치에서도 동일하게 실패(신규 회귀 아님)**:

| 파일 | 케이스 | 비고 |
|---|---|---|
| `src/core/utils/category.test.ts` | favor/ceremony 서브카테고리 2건 | `04_integration_report.md` §6에 리더가 이미 기록한 기존 결함(`dea757c` 서브카테고리 5종 추가 시 테스트 미갱신 추정) |
| `src/adapters/browser/cloudinary/widget.test.ts` | 크롭 가능한 단일 이미지 위젯 초기화 1건 | **이번 스위트 실행에서 새로 확인**. 미보고 상태였음 — 아래 §5 참고 |
| `src/app/(preview)/preview/[publicKey]/_utils/invitationMessage.mapper.test.ts` | 부모 연락처 관계 표시 1건 | **이번 스위트 실행에서 새로 확인**. 미보고 상태였음 — 아래 §5 참고 |

이 브랜치(`feat/admin-dashboard-real-data`)는 `dev` 최신 커밋(`d1da0af`)에서 분기했고, `git diff dev...HEAD --stat` 확인 결과 이 3개 파일 중 어느 것도 이 브랜치가 건드리지 않았다. `cloudinary/widget.test.ts`와 `invitationMessage.mapper.test.ts`를 격리 실행해도 동일하게 실패해 테스트 오염이 아님을 확인했다. 즉 4건 전부 `dev` 상태 그대로의 기존 실패이며, 이 기능이 만든 회귀가 아니다.

### 4.3 Lint / 타입체크
- `npx eslint "src/app/(admin)/admin/dashboard/page.integration.test.ts" "vitest.config.ts"` → 0 errors, 0 warnings
- `npx tsc --noEmit` → 0 errors
- (참고: `npm run lint`를 리포지토리 루트에서 그대로 돌리면 다른 세션의 워크트리(`.claude/worktrees/fix-admin-route-navigation/`)에 있는 vendored 파일까지 스캔해 무관한 대량 오류가 섞여 나온다 — 이번 변경분만 범위를 좁혀 별도 확인함)

---

## 5. 스코프 밖 — 별도 확인 권고

`cloudinary/widget.test.ts`·`invitationMessage.mapper.test.ts` 실패 2건은 `04_integration_report.md` §6에 아직 기록돼 있지 않다. admin 대시보드 기능과 무관하고 설계 변경 없이 고칠 수 있는 성격의 버그도 아니라 이번 스코프에서 고치지 않았다(에이전트 지침상 사소한 수정만 직접 고치고 그 외는 플래그만 남기게 되어 있음) — 리더가 `04_integration_report.md` §6 표에 3·4번 항목으로 추가하거나 별도 Issue 등록을 검토해야 한다.

---

## 6. 완료 기준 체크

- [x] 골든패스 통합 테스트(DB 시딩 → 실제 렌더 데이터) 작성
- [x] 빈 상태(상태 C+D) 회귀 테스트 작성 — `01_ui_flow.md` §5.1 명시 케이스
- [x] 비인가/미인증 회귀 확인(가벼운 수준)
- [x] `npm run test` 전체 스위트 실행·통과 확인(신규 실패 0건, 기존 무관 실패 4건은 `dev`에서도 동일)
- [x] lint(신규/변경 파일 범위) 통과
- [x] tsc 통과
- [x] 표준 브랜치에 직접 작업(워크트리 미사용)
