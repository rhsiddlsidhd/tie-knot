# TODO

## 진행 방식

- 작업 항목 1개 = worktree 1개 = branch 1개 (`~/.codex/docs/GIT.md` worktree 규칙)
- 완료 → PR → `dev` merge → 로컬/원격 branch 삭제 → worktree remove
- 클러스터(파일·주제 겹침)는 같은 worktree에서 순차 처리한다 — 의존성이 없어도 같은 파일이면 병렬로 나누지 않는다
- TODO.md 갱신은 `docs/todo-section-taxonomy` 브랜치에서만 한다. 작업 브랜치는 "미분류 인박스"에만 append (`AGENTS.md` Git 규칙)

## 섹션 기준

항목을 어느 섹션에 넣을지는 **발견 경로가 아니라 아래 정의**로 판단한다. 발견 경로는 항목 본문에 태그로 남긴다.

| 섹션 | 정의 | inbound | 판정 |
| --- | --- | --- | --- |
| 새 피처 | 새 엔드포인트·화면·데이터모델이 동시에 신설 | 사업 요구 (스윕 아님) | `feature-team-orchestrator` 5-Phase 통과 |
| 버그 수정 | 기존 스펙 위반. 정답이 이미 있음 | 실사용·playwright 중 기능 미작동 · test-suite · 코드 리뷰 · 대조군 실험 | 재현 절차 → fix → 회귀 테스트 그린 |
| 성능 개선 | 동작은 맞으나 비용이 과함. 정답 = 수치 | lighthouse 리포트(프론트) · 쿼리/인덱스 리뷰(백엔드) | 변경 전후 측정 대조 |
| UI 수정 | 동작하지만 부족·불편. 정답 = 요청자 지시 또는 프로젝트 개요 대비 판단 | 실사용 워크스루(신규 화면 직후, 반복 N회) · 라우트 상태 매트릭스(빈·로딩·에러·극단값) · 개요 변경 시 라우트 목적 대조 · lighthouse a11y/best-practices | 시각 확인 (before/after) |

- 목적 밖 발견은 세 갈래로 처리한다(전역 `GIT.md` Branch 규칙) — 현재 작업을 **막으면** 같은 브랜치에서 커밋 분리해 고치고, **막지 않으면** 미분류 인박스에 적고 지금 고치지 않으며, **다른 작업을 무력화하면**(게이트 무력화·데이터 손상·보안) 작업을 멈추고 별도 브랜치로 즉시 처리한다.

---

## 새 피처

- [ ] **마켓플레이스 전환 (제3자 판매자 입점)** (2026-08-06 논의, 미착수)
  할 일: 착수 전 팬아웃 설계 — `SELLER` role 추가, 상품 소유권 개념 신설(`authorId` 의미를 "등록한 관리자"→"소유 판매자"로 전환), 정산/수수료·판매자 스토어페이지·관리자 검수 플로우 신규 설계
  위치: `user.model.ts:2`(`UserRole`), `createProduct.ts`(role 체크)
  근거: 현재 상품등록은 `role !== "ADMIN"` 체크로 관리자 전용(자사 직접판매몰 구조) — 제3자 판매자 입점 구조로 전환 논의됨
  상태: 미착수. "상품 카테고리별 확장"과 별개 트랙 — 섞어서 진행 금지

---

## 버그 수정

> 현재 상태(2026-08-13): 선행 블로커 없음 — 클러스터 1→2→3 순서로 진행, 이후 "단독"은 순서 무관. 착수 전 각 항목의 `file:line`을 먼저 읽는다(라인은 드리프트될 수 있음).

### 클러스터 1 — 이미지 파이프라인 (아래 순서)

- [ ] **상품 이미지 업로드가 Server Action 기본 body size limit(1MB)에 걸림** (2026-08-07 발견, 2026-08-12 확인)
  할 일: (임시) `next.config.ts`에 `experimental.serverActions.bodySizeLimit` 상향 — (근본) `next-cloudinary`(설치돼 있으나 미사용)로 클라이언트 직접업로드 전환 + `images` 요청 계약을 `string[]`로 변경(별도 설계 필요)
  위치: `next.config.ts`, `createProduct`/`updateProduct`의 FormData 처리부
  근거: Next16 기본 1MB, 실사진 몇 장이면 걸림(vitest mock File은 작아 지금까지 미발견). couple-info 폼은 이미 signed 직접업로드(`src/app/api/upload/signature`)로 우회한 전례
  완료 기준: 수 MB급 실사진 다건 업로드 성공. 목데이터는 작은 이미지로 우회 가능 — 이 항목이 착수를 막지 않음
- [ ] **상품 상세 페이지가 `images`(갤러리) 필드를 렌더링하지 않음** (2026-08-07 발견, 2026-08-12 확인)
  할 일: `images: string[]`을 `ProductDetailTemplate`→`ProductFeatures`(또는 신규 갤러리 organism)로 전달·렌더
  위치: `ProductFeatures.tsx:47`(빈 섹션), `ProductDetailTemplate.tsx:18`(images 미전달)
  근거: 등록 폼은 non-invitation 카테고리에 images 최소 1장 강제하는데 고객 노출은 0 — 답례품/웨딩소품처럼 사진이 구매결정에 중요한 카테고리에 치명적
  완료 기준: 5개 카테고리 상세페이지에서 등록 이미지 전부 노출

### 클러스터 2 — 카테고리별 하드코딩 문구 (같이 고칠 것)

- [ ] **`OrderSummary.tsx` 카테고리 무관 "청첩장 템플릿" 하드코딩** (2026-08-07 발견, 2026-08-12 확인)
  할 일: `CheckoutItem`에 카테고리 필드 추가 → `OrderSummary.tsx:57`을 카테고리별 상품유형명으로 분기
  위치: `src/client/components/organisms/OrderSummary.tsx:57`, `CheckoutItem` 타입
  근거: 카테고리 5종인데 답례품/방명록 주문서에도 "청첩장 템플릿" 고정 노출
  완료 기준: 5개 카테고리 주문서 각각 올바른 상품유형명 렌더 + 회귀 테스트
- [ ] **상품 상세 invitation 전용 안내 문구가 전 카테고리 노출** (2026-08-07 발견, 2026-08-12 확인)
  할 일: `ProductSummary.tsx:121,127,133` 3개 문구를 카테고리 분기(invitation만 노출)
  위치: `src/client/components/organisms/ProductSummary.tsx:121,127,133`(pure — 컨테이너는 `.../[id]/_components/ProductSummary.tsx`, 혼동 주의)
  근거: "즉시사용/평생호스팅/모바일작동" 문구가 캔들홀더 등 실물상품에도 노출. `OrderSummary` 항목과 동일 패턴 — 함께 처리
  완료 기준: 5개 카테고리 각각 올바른 문구 노출 + 회귀 테스트

### 클러스터 3 — 관리자 등록 폼 (`organisms/ProductRegistrationForm.tsx`, UI섹션 "연속 등록 워크플로우"와 같은 파일 — 함께 처리 권장)

- [ ] **상품 등록 폼 가격 input이 `step="1000"` 강제 + 실패 시 무피드백** (2026-08-07 발견, 2026-08-12 확인)
  할 일: `price` input `step` 완화 또는 커스텀 에러 메시지 노출(1000원 배수 아닌 값 제출 시 조용히 씹히는 문제 해결)
  위치: `ProductRegistrationForm.tsx:204`(price). `:236,319,502,523`은 다른 필드 step — 이번 스코프 아님, 별도 판단
  근거: 4500원처럼 비정형 가격 입력 시 브라우저 native validation 실패로 클릭이 조용히 씹힘(`element.validity.valid===false`), 화면 에러 없음 — 답례품 등 저가·비정형 가격 카테고리에서 특히 문제
  완료 기준: 비1000원배수 가격 제출 시 명확한 에러 표시 또는 정상 등록

### 단독 — 연관 항목 없음, 순서 무관

- [ ] **사이드바가 최초 진입 시 관리자도 "일반 계정"으로 순간 표시** (2026-08-07 발견, 2026-08-12 범위확대 확인)
  할 일: role 로딩 전 기본값을 "일반" 대신 로딩 스켈레톤/빈 상태로 변경. 3곳 layout 테스트의 `"세션 없으면 일반 계정"` assertion부터 수정(Red proof)
  위치: `admin/layout.tsx:32`, `(my-order)/layout.tsx:25`, `(my-profile)/layout.tsx:25` — 3곳 동일 패턴, 대응 `layout.test.tsx` 각각
  근거: role이 `/api/auth/me` 비동기 도착 전 기본값 "일반" — 관리자에게 순간 오탐 신호. 기존 스펙 위반(정답 있음)이라 버그수정 분류
  완료 기준: 3곳 전부 로딩 중 오탐 표시 없음 + 테스트 그린

- [ ] **존재하지 않는 productId+non-invitation category로 `updateProduct` 시 `NOT_FOUND` 아닌 `INTERNAL`(500)** (2026-08-07 발견, 2026-08-12 원인확정)
  할 일: validator 또는 `.catch` 분기 재설계 — 문서 없음(category undefined)과 실제 검증실패를 구분해 `NOT_FOUND` 반환
  위치: `product.model.ts:106`(validate),`:112`(getQuery 폴백),`:124`(includes 판정) / `product.service.ts:293`(.catch)
  근거: discriminator 없는 4종 카테고리(favor/accessory/guestbook/ceremony) 도입으로 새로 열린 경로. 데이터 무결성 문제 아님, 에러코드 오분류 — 우선순위 낮음
  완료 기준: 존재하지 않는 productId 요청 시 404 응답 + 회귀 테스트

- [ ] **오케스트레이터·구현자 문서가 제거된 pre-commit 게이트를 실패 트리거로 참조 — TDD Guard 실제 메커니즘과 불일치** (2026-08-12 발견, 2026-08-13 리팩터로 재정의)
  할 일: 4곳 문구를 "pre-edit deny(reason에 복구 커맨드 포함) → 안내대로 재시도, 반복 실패 시 에스컬레이션"으로 통일 재작성
    1. `SKILL.md:140` 에러표 — `:14`("pre-commit gate 제거됨")와 모순, 실제 실패(pre-edit deny)에 대응하는 행이 없음
    2. `backend-impl.md:44-45`, `frontend-impl.md:44-45` — 동일 phantom pre-commit 문구 중복(실존 훅은 `commit-msg`뿐)
  위치: 위 3개 파일 5개 앵커
  근거: `guard.mjs` deny가 이미 복구커맨드를 실어 보냄(`guard.mjs:69`→`pre-edit-response.mjs:3-11`→`claude.mjs:24-26`) — 실행은 안 막힘, 문서 내부 모순만 남은 상태(착수 블로커 아님)
  완료 기준: 3개 문서 5곳 전부 실제 메커니즘 반영, `SKILL.md:14`/`:140` 모순 해소
  참고: `test-suite.md`의 `npm run test` 문제는 인박스 "test-suite.md 사실오류" 항목에 흡수(별개 근본원인)

---

## 성능 개선

- [ ] **`Product` 복합 인덱스 추가 검토** (2026-08-07 발견, 2026-08-12 확인: 인덱스 0개)
  할 일: `{deletedAt:1, category:1, isFeatured:-1, priority:-1, createdAt:-1}`(ESR순) 인덱스 추가 검토 — category 미지정 전체목록 경로는 여전히 in-memory sort라 커버하려면 별도 인덱스 1개 더 필요
  위치: `Product` 모델
  근거: 카테고리 1→5종 확장으로 category 필터에 실질적 선택도 발생, 현재 `_id` 외 인덱스 없음
  완료 기준: 실데이터 규모 확인 후 필요시 인덱스 추가 + 쿼리플랜 전후 대조(수치)

- [ ] **PR CI가 변경 파일과 무관하게 14개 job 전량 실행** (2026-08-13 발견, PR #19가 TODO.md 1줄 변경으로 unit×7/integration×2/e2e/mutation 등 14개 전부 트리거됨)
  할 일: `dorny/paths-filter`로 첫 job에서 changed-files boolean 산출 → 나머지 14개 job은 `needs: filter`로 받아 실제 테스트 실행 스텝만 `if:`로 감싼다. **워크플로우 레벨 `paths-ignore`나 job 자체 skip은 쓰지 않는다** — job이 안 돌면 required check가 "Pending"에 멈춰 PR이 영구 대기(GitHub 공식 문서 확인된 gotcha).
  위치: `.github/workflows/tdd.yml`
  근거: `dev` 브랜치 protection에 14개 전부 required_status_checks로 걸려있고 `enforce_admins:true`(`gh api repos/.../branches/dev/protection` 확인) — job은 유지한 채 내부 스텝만 조건부 skip해야 required 계약이 안 깨짐. 업계 표준(빠른 건 자주, 느린 건 조건부)과도 일치, `dorny/paths-filter`+`needs`/`if:` 패턴이 사실상 정석([GitHub 공식 트러블슈팅](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks), [Pantsbuild](https://www.pantsbuild.org/blog/2022/10/10/skipping-github-actions-jobs-without-breaking-branch-protection)).
  완료 기준: docs-only PR에서 무거운 job(e2e/mutation/integration/unit)이 실제 테스트 없이 즉시 success 보고 + required check 14개 전부 정상 충족 확인, src/scripts 변경 PR에서는 기존과 동일하게 전부 실행되는 것도 대조 확인

---

## UI 수정

- [ ] **상품 등록 폼이 연속 등록 워크플로우 미지원** (2026-08-07 발견, 2026-08-12 확인, 버그수정 클러스터3과 동일 컴포넌트 — 함께 처리 권장)
  할 일: 등록 성공 시 카테고리/서브카테고리 값 유지한 채 "저장하고 계속 등록" 옵션 추가(현재 무조건 `/admin/products` 리다이렉트)
  위치: `.../admin/products/new/_components/ProductRegistrationForm.tsx:27`
  근거: 대량 등록 시나리오에서 매번 폼을 처음부터 채워야 함
  완료 기준: 연속 등록 시 직전 카테고리값 유지(시각 확인)

---

## 미분류 인박스

> 작업 브랜치는 **이 구역에만 append**한다(경량 포맷: `- [ ] (날짜, 발견 맥락) 증상 — 위치/근거`, 아래 서술형 대신 이 형식으로 추가). 정식 섹션으로의 분류·이동·완료 체크, 하위 그룹 재편은 `docs/todo-section-taxonomy` 브랜치에서만 한다. 완료 처리는 항목을 지우는 것으로 끝난다 — git log가 기록을 대신한다.

### 배포 후 실행 (미배포 상태라 보류 — 배포되면 순서대로)

- [ ] **배포 환경 변수 등록 + Lighthouse 감사** (2026-08-11) — `.env.example`의 운영 필수 값 + `MAIN_PREVIEW_INFO_ID`/`MAIN_PREVIEW_PRODUCT_ID`/`CLOUDINARY_UPLOAD_PRESET` 등록 후 실제 배포 URL로 Lighthouse 실행.
- [ ] **PortOne 실결제 manual smoke** (2026-08-11, `inicis_v2` 테스트 채널 확정됨) — self-hosted runner(`self-hosted`,`linux`,`x64`,`portone-smoke`) + 사람 카드 인증으로 12,000원 결제→`PAID` 조회→store/channel/paymentId 검증→전액취소→`CANCELLED` 재조회. 실패해도 cleanup 보장.
- [ ] **PortOne webhook 실전달 검증** (2026-08-11) — 배포 URL을 webhook으로 등록, 운영 `PORTONE_WEBHOOK_SECRET` 설정, 진위검증·멱등처리·주문상태반영을 실제 전달로 확인. 위치: `src/app/api/webhooks/portone/route.ts`, `payment.service.ts`.

### TDD Guard 정책 재검토

- [ ] **요구 scope 판정 규칙 — 배럴 재수출 + import 전이 경계** (2026-08-10 발견, 2026-08-12 수치 갱신) — `vi.mock("@/...")` 112건 중 배럴 디렉터리 통째 mock이 상위 4곳(`@/server/services` 27·`@/server/actions` 14·`@/client/hooks` 14·`@/client/components/organisms` 8). 타입 import 강제(#16) 후 integration 요구 308/410(75.1%)→262/410(63.9%)로 46개 줄었지만 나머지 262개는 실값 의존이라 그 규칙만으론 더 안 줄어듦. 직접 import만 경계로 좁히면 69/410(17%)까지 떨어지나 `src/server/actions/*`처럼 service 경유 DB접근 파일이 unit만 요구하게 돼 과소 요구로 뒤집힘 — `testing-classification.md:16`("둘 이상의 실제 경계 연결") 기준에 맞는 중간 규칙 필요. 위치: `classify-scope.mjs`.
- [ ] **`run-vitest.mjs`가 `guard` project(scripts 테스트)를 실행 못함** (2026-08-12) — `projectFor`가 scope `unit`이면 항상 project `unit` 반환, `scripts/**/*.test.mjs`(project `guard`)는 대상 밖. guarded 범위가 `src/`뿐이라 당장 실해는 없으나 scripts 테스트를 Red/Green proof로 못 돌림. 위치: `run-vitest.mjs:6`.
- [ ] **`codex.mjs` 훅 스키마가 Codex CLI 계약과 맞는지 미확인** (2026-08-12) — `hookSpecificOutput`/`permissionDecision` 등은 Claude Code 스키마 어휘. `.codex/hooks.json`도 Claude Code 구조(`matcher`/`statusMessage`)를 본떴다. 계약이 다르면 `exit 0`으로 나가 차단이 안 걸릴 수 있음 — Codex 문서 확인 + 실증 필요.
- [ ] **test-suite agent 사실오류 + 역할 재설계** (2026-08-13) — `:11` "브라우저 E2E(Playwright) 없음"은 거짓(`testing/e2e/core.spec.ts`가 `npm run test:e2e`로 `tdd.yml:117` CI 게이트로 실행 중), `:19`는 같은 파일에서 Playwright를 인프라로 언급해 `:11`과 자기모순, `:27` `npm run test`(bare)는 항상 실패. 요구: agent 이름·역할·skill 재설계 — Phase4 골든패스를 unit/integration/E2E 중 어디에 반영할지 판단 기준이 없다, `boundary-verifier`+`boundary-verify` 패턴으로 전환. 실행은 `harness` 스킬.

### 잡음 정리 (낮은 우선순위)

- [ ] **`vite-tsconfig-paths` deprecation 경고** (2026-08-10) — 실행당 6줄 출력, Vite 네이티브 `resolve.tsconfigPaths:true`로 교체 검토.
- [ ] **`test-graph.mjs`의 `element.isTypeOnly` deprecation(TS6385)** (2026-08-12) — 대체 API 확인 후 정리. 위치: `test-graph.mjs:41`.

### 개별 판단 필요

- [ ] **`connect.ts`의 `??`가 빈 문자열을 폴백 안 함** (2026-08-09) — `testUri ?? srvUri`는 `MONGO_TEST_URI=`처럼 값이 빈 문자열이면 폴백 안 해 연결이 원인불명 에러로 실패. `||`로 바꾸면 해소되나 프로덕션 동작 변경이라 판단 필요. 위치: `connect.ts:35`.
