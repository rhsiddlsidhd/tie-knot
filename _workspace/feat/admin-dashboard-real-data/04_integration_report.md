# 04 — 통합 리포트: admin 대시보드 실데이터 연결

> 작성: 리더 (feature-team-orchestrator)
> Phase 0~3 완료, Phase 4(test-suite) 착수 전 요약

---

## 1. 요구사항 충족 판정

| REQ | 설명 | 수용 기준 | 판정 |
|---|---|---|---|
| REQ-1 | 대시보드 상단 통계 카드를 실제 DB 집계값으로 렌더링 | `/admin/dashboard` 접속 시 상품/매출/주문/회원 카드가 실제 DB 값 표시, 등록·주문 발생 시 갱신 | **충족** — `getDashboardStatsService`가 `force-dynamic` 페이지에서 매 요청 재집계(캐싱 없음), `page.tsx`가 직접 연결(9472de2) |
| REQ-2 | '최근 활동' 카드를 실제 데이터로 렌더링 | placeholder 대신 실제 목록, 빈 상태 문구 존재 | **충족** — "최근 주문"으로 개칭, `RecentOrdersCard`가 최근 5건 테이블 렌더, 빈 배열 시 빈 상태 블록(§5 상태 D) |

두 항목 모두 boundary-verifier PASS(강제 PASS 아님, REDO 0)로 뒷받침됨.

## 2. Phase별 산출물

- Phase 0: `00_requirements.json`
- Phase 1: `01_api_contract.md`(api-designer) / `01_ui_flow.md`(ui-designer) / `01_db_schema.md`(db-migrator) — 3자 합의, 미해결 쟁점 0
- Phase 2+3: `03_boundary/`에 유닛별 판정 5건 + 전제조건 3건 기록

## 3. 구현 요약

**변경/신규 파일 (7커밋, `dev` 대비):**
- `src/core/domain/order.ts` — `PAID_ORDER_STATUSES`, `ORDER_STATUS_LABELS`/`ORDER_STATUS_BADGE_VARIANTS` 승격
- `src/core/domain/dashboard.ts` (신규) — `DashboardStats`/`DashboardRecentOrder`
- `src/core/utils/date.ts` — `getKstMonthRange`(backend), `formatRelativeTime`(frontend) 추가, 각각 테스트 동반
- `src/core/utils/percent.ts` (신규) — `formatSignedPercent` + 테스트
- `src/models/order.model.ts` — `{ createdAt: -1 }` 인덱스 추가
- `src/services/dashboard.ts` (신규) — `getDashboardStatsService`, 4-쿼리 병렬 집계, `AppError` 래핑, 통합테스트 11건
- `src/app/(admin)/admin/dashboard/_components/` (신규) — `AdminDashboardTemplate`/`RecentOrdersCard`/배럴, 렌더 테스트 4케이스(A/C/D/오픈첫달)
- `src/app/(admin)/admin/dashboard/page.tsx` — mock 배열 제거, 서비스 직접 연결
- `src/app/(admin)/admin/orders/_components/AdminOrdersTemplate.tsx`, `.../mockOrders.ts` — 상태 라벨 상수 중복 제거(F1)

## 4. 초안(그릴링 없이 즉흥 작성됐던 이전 세션 코드) 대비 실질 변경 — 설계 재검토로 잡힌 것

전부 `01_api_contract.md` §8에 근거 명시. 핵심만:

1. 매출/결제주문 기준 시각 `createdAt` → `confirmedAt` (가상계좌 입금월 불일치 방지)
2. "주문" 카드 모집단을 매출과 통일(결제 완료만) — 안 그러면 옆 카드와 나눠 낸 객단가가 틀린 값
3. 월 경계를 서버 로컬 TZ(UTC)에서 KST 명시로 수정 — 9시간 어긋남 버그
4. 필드명 8개 규칙 통일(`{지표}ThisMonth/PreviousMonth`)
5. 서비스 에러 처리 누락(raw mongoose 에러 누출) 수정 — `AppError` 래핑
6. 쿼리 9개 → 4개로 병합
7. trend 색상 버그 수정(기존 mock 코드가 무조건 `text-primary`라 매출 감소도 긍정색)

## 5. 운영 데이터 전제조건 — 리더가 직접 실측, 전부 해소

- `confirmedAt` 결측: 0건 (결제 완료 주문 총 1건 중)
- `User.isDelete` 결측: 0건

둘 다 읽기 전용 확인이었고 backfill 쓰기는 발생하지 않았다.

## 6. 스코프 밖 — 별도 Issue 등록 대상

| # | 항목 | 근거 |
|---|---|---|
| 1 | `src/core/utils/category.test.ts`의 `getSubCategoryOptions` 2건(favor/ceremony) 선행 실패 | 이 기능과 무관 — 변경 0인 `dev`에서도 동일 실패. `dea757c`(서브카테고리 5종 추가) 때 테스트 미갱신으로 추정. CI(`static.yml`)는 vitest를 안 돌려 PR을 막지 않음 |
| 2 | `src/db/connect.ts`의 `dbConnect()`가 에러를 `AppError`로 안 감쌈 | `services/AGENTS.md` 규약과 어긋나지만 이 브랜치가 도입한 편차 아님 — 전 서비스 공통 기존 패턴 |
| 3 | `/admin/orders`가 여전히 `MOCK_ORDERS` 기반 | 설계 단계에서 스코프 밖 합의. 단 이번에 추가한 `{createdAt:-1}` 인덱스가 그쪽 실데이터 전환의 DB 선행조건을 이미 충족시켜둠 |
| 4 | Product/User 소프트 삭제 컨벤션 불일치(`deletedAt` vs `isDelete`) | 통일하려면 전 문서 backfill + 쿼리 전수 수정 필요, 별도 작업 |

## 7. Phase 4 위임 사항

test-suite에게 골든패스 통합 테스트 작성 요청 예정. 이미 unit/integration 레벨 커버리지(서비스 11건, Template 4케이스, 유틸 다수)가 두터운 편이라, Phase 4는 **E2E 관점(admin 로그인 → 대시보드 진입 → 실제 렌더 확인)** 에 집중해도 될 것으로 판단.
