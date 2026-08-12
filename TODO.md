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

- [ ] **마켓플레이스 전환 (제3자 판매자 입점)** (2026-08-06 방향성만 논의, 착수 아님) — 현재 `UserRole`은 `"USER" | "ADMIN"` 둘뿐이고(`user.model.ts:2`) 상품 등록은 `createProduct.ts`의 `role !== "ADMIN"` 체크로 관리자 전용(자사 직접판매몰 구조, `authorId`는 "등록한 관리자"만 의미). `SELLER` role 추가해 제3자 판매자가 직접 상품을 입점시키는 구조로 전환하는 방향이 논의됨. 착수 시 파급 범위 큼 — 착수 전 별도로 팬아웃 설계 필요:
  - 상품 등록/수정/삭제 권한 체크 전반에 `SELLER` 포함, 상품 소유권 개념 신설(자기 상품만 수정/삭제 가능하도록 인가 로직 추가 — `authorId`의 의미가 "등록한 관리자"에서 "소유 판매자"로 바뀜)
  - 판매자 정산/수수료 체계, 판매자 프로필/스토어 페이지, 관리자의 판매자 상품 검수 플로우 등 마켓플레이스 특유 기능 신규 설계
  - "상품 카테고리별 확장"과 별개 트랙 — 섞어서 진행하지 않는다.

---

## 버그 수정

> **2026-08-12 전수 재검증 완료** — 코드 대조로 항목 유효성과 위치를 다시 확인했다. 이 날짜 이후 다시 낡을 수 있으므로 착수 전 해당 파일을 먼저 읽는다.
>
> 처리 순서: **선행 3건(가드레일)을 먼저** 끝낸 뒤 클러스터 1~3으로 간다. 앞의 2건은 나머지 전부의 작업 단가를 좌우하고, 3번째는 그 작업들이 남길 커밋의 규칙 강제를 되살린다. 클러스터 안에서는 위→아래 순서를 권장한다(파일·맥락 겹침 기준).

### 선행 — 가드레일 정합·복원 (아래 순서대로)

- [ ] **하네스 문서가 존재하지 않는 pre-commit 게이트를 계약으로 명시 — 구현 에이전트가 TDD Guard를 모른 채 차단당함** (2026-08-12 발견 [발견: TODO 전수 재검증 중 가드레일 구조 감사]) — `.claude/agents/backend-impl.md`, `frontend-impl.md`, `test-suite.md` 세 파일에 TDD Guard·`test:red`·proof 언급이 **0건**이다. 대신 `backend-impl.md:44`와 `frontend-impl.md:44`가 "pre-commit 훅(lint/coverage80%/typecheck)에 막히면 원인 해결 후 재시도, 3회 실패 시 에스컬레이션"이라는 절차를 규정하는데 **그 훅은 존재하지 않는다**(`.git/hooks/`에 훅 0개, `.claude/settings.json`은 TDD Guard PreToolUse/PostToolUse만 등록).
  - **실제 동작**: `guard.mjs pre-edit`가 유효 proof 없는 guarded 파일 편집을 `permissionDecision: "deny"`로 차단한다(`bin/guard.mjs:64`). 즉 구현 에이전트는 첫 `Edit`/`Write`에서 막히는데, 대응 절차(`npm run test:red -- --scope <scope>`)가 지침에 없어 복구 경로가 없다.
  - **내부 모순**: `feature-team-orchestrator/SKILL.md:14`는 TDD Guard 계약으로 갱신됐는데 같은 파일 `:140`은 여전히 phantom pre-commit 게이트를 표로 남겨뒀다.
  - **부수**: `.claude/agents/test-suite.md:27`이 지시하는 `npm run test`는 현재 실패하는 명령이다(아래 "단독" 섹션 항목 참고).
  - **비용**: 대상 파일이 전부 unguarded(`docs/` 및 `.claude/`)라 Red proof 없이 수정 가능 — 착수 비용이 가장 낮다.

- [ ] **TDD Guard의 요구 scope 산정이 type-only import를 런타임 경계로 오판해 부풀린다** (2026-08-12 발견 [발견: 항목별 게이트 비용 측정 중], 실증 완료) — `scripts/tdd-guard/core/classify-scope.mjs`의 `localDependencies`가 정규식 `(?:from\s+|import\s*)["']([^"']+)["']`로 import를 긁어 **`import type`을 걸러내지 않는다**. 그래서 타입 하나만 참조해도 그 사슬 끝의 mongoose·`use server` 경계가 걸려 `integration` proof가 강제된다.
  - **실증(2026-08-12)**: 프로브 파일 대조 — `import type { PremiumFeature } from "@/server/services"` 한 줄만 있는 파일이 `requiredScopes: ["integration","unit"]`(사유 "Mongoose/MongoDB 실행 경계 변경"), import를 지우면 `["unit"]`.
  - **영향 범위**: `guard.mjs classify`로 측정한 결과 아래 클러스터 대상 파일이 **전부** `integration` 요구 — 순수 프레젠테이셔널인 `ProductFeatures.tsx`, `OrderSummary.tsx`, `ProductSummary.tsx`, `ProductRegistrationForm.tsx`, `(admin)/admin/layout.tsx` 포함. 문구 한 줄 수정에도 mongod 기동 + 직렬 integration 실행이 붙는다.
  - **정답이 이미 있음**: 같은 가드의 `scripts/test-scope/test-graph.mjs:runtimeSpecifiers`가 TypeScript AST로 type-only import를 정확히 배제한다. 두 모듈이 같은 판정을 다르게 하고 있어 정합만 맞추면 된다.
  - **증폭 요인**: 배럴 강제 규칙(인박스 항목 참고)이 타입 하나를 `@/server/services` 배럴 경유로 mongoose 사슬에 연결시킨다.
  - **주의**: 게이트 완화 방향의 변경이다. `scripts/`는 guarded라 이 수정 자체에 Red proof가 필요하며, `scripts/tdd-guard/__tests__/`에 회귀 테스트를 먼저 세운다.

- [ ] **저장소 분리 때 유실된 커밋 규칙·리뷰 강제 복원** (2026-08-12 발견 [발견: 훅 부재 확인 중 원본 저장소 대조]) — tie-knot은 `9d69d51 chore: tie-knot 저장소를 분리`로 agent-benchmark 모노레포에서 떨어져 나왔는데, 그때 추적 대상이 아니거나 삭제된 가드레일 자산이 재생성되지 않았다.
  - **`commit-msg` 훅 이식**: 전역 `GIT.md`의 Naming 규칙을 검사하는 훅이 tie-knot에 없어, prefix 택소노미·`{prefix}({scope}): {message}` 형식·72자 상한을 강제하는 지점이 **로컬에도 CI에도 0개**다(`.github/workflows/`에 commitlint·PR 제목 검증 job 없음). 원본은 `/home/rhsiddlsidhd/agent-benchmark/.git/hooks/commit-msg`(2026-08-10)에 살아 있고 이미 고쳐진 버전이다 — 정규식 `^(feat|fix|docs|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9]+(-[a-z0-9]+)*\))?!?: ` 에 72자·소문자 시작·마침표 금지 검사까지 포함해 현행 `GIT.md`와 일치한다(과거형·명사구 판별만 미구현).
    - **추적되는 위치로 승격할 것**: `.git/hooks/`는 Git 추적 대상이 아니라 clone·저장소 재구성마다 증발한다. 이번 유실이 정확히 그 경로였다. 저장소 내 스크립트 + `core.hooksPath`(또는 husky)로 두어야 재발하지 않는다.
    - 검사 대상은 메시지 텍스트뿐이다. 코드 검사(`pre-commit` 계열)는 복원 대상이 아니다 — TDD Guard(에이전트 훅)와 PR CI가 그 책임을 나눠 갖는다.
  - **`.github/CODEOWNERS` 재생성**: 분리 커밋이 지운 뒤 tie-knot에 다시 만들어지지 않았다. 원본은 `scripts/tdd-guard/`, `.claude/settings.json`, `.codex/hooks.json`, `tdd-exceptions.json`, `.github/workflows/tdd.yml`, `.github/workflows/portone-smoke.yml`을 소유자 리뷰 필수로 묶고 있었다(`git show 9d69d51^:.github/CODEOWNERS`, 경로는 모노레포 기준이라 tie-knot 기준으로 다시 써야 함). 지금은 가드레일 자체를 무력화하는 변경에 리뷰 강제가 없다.
  - **PR 템플릿 부재**: 저장소에 템플릿이 없다. 전역 규칙상 `~/.codex/docs/references/pull_request_template.md`를 쓰거나 저장소 템플릿을 신설한다.

### 클러스터 1 — 이미지 파이프라인 (아래 순서)

- [ ] **상품 이미지 업로드가 Server Action 기본 body size limit(1MB)에 걸리는 잠복버그** (2026-08-07 발견, 목데이터 삽입 준비 중 논의 — 2026-08-12 재확인) — `createProduct`/`updateProduct`가 `thumbnail`/`images`를 File 객체 그대로 FormData에 실어 Server Action으로 보내는데, `next.config.ts`에 `experimental.serverActions.bodySizeLimit` 오버라이드가 없어 Next.js 16 기본값 1MB가 그대로 적용된다(`node_modules/next/dist/docs/01-app/02-guides/server-actions.md:83`). 실사진(수 MB급) 몇 장이면 걸린다 — vitest 목업 File이 작아서 지금까지 안 걸렸을 뿐. 청첩장(couple-info) 폼이 같은 문제로 클라이언트 직접업로드(signed, `src/app/api/upload/signature`)로 우회한 전례가 있다(2026-08-12 존재 확인).
  - **참고**: `next-cloudinary`(v6.17.5)가 설치돼 있고 `CldUploadWidget`/`CldUploadButton`을 제공하는데 `src/` 어디서도 안 쓴다(2026-08-12 재확인, 사용 0건). 이걸로 전환하면 서버가 파일 바이트를 안 거쳐 body limit 문제가 구조적으로 사라진다. 단 `images` 요청 계약(`{existing: string[], newFiles: File[]}`)을 `string[]`로 바꿔야 하는 규모 있는 변경이라 별도 설계 필요.
  - **비용**: `next.config.ts`는 guard 예외(`*.config.ts` 제외 규칙)라 임시 완화만 한다면 proof 없이 가능. 클라이언트 직접업로드 전환은 별개.
  - 목데이터 삽입은 작은 플레이스홀더 이미지로 우회 가능 — 이 항목이 착수를 막지는 않는다.
- [ ] **상품 상세 페이지가 `images`(상세 이미지 갤러리) 필드를 아예 렌더링하지 않음** (2026-08-07 발견, 목데이터 14건 실등록 검증 중 — 2026-08-12 재확인) — `src/client/components/organisms/ProductFeatures.tsx:47`의 "상세 정보" 섹션이 헤딩만 있고 본문이 0줄이다. `src/app/(main)/(products)/products/[category]/[id]/_components/ProductDetailTemplate.tsx:18`이 `ProductFeatures`에 `options`(premiumFeatures)만 넘기고 `product`/`product.images`를 전달하지 않는다 — 갤러리 소비 코드가 통째로 없다. 등록 폼은 non-invitation 카테고리에 `images`를 필수(최소 1장)로 강제하는데 정작 고객에게는 노출이 0인 상태 — 사진으로 구매를 설득해야 하는 답례품/웨딩소품에서 특히 치명적. `images: string[]`를 `ProductDetailTemplate`→`ProductFeatures`(또는 신규 갤러리 organism)로 내려서 렌더링을 추가한다.

### 클러스터 2 — 카테고리별 하드코딩 문구 (같이 고칠 것)

- [ ] **`OrderSummary.tsx` "청첩장 템플릿" 하드코딩** (2026-08-07 발견 — 2026-08-12 재확인) — `src/client/components/organisms/OrderSummary.tsx:57`이 주문서 상품명 아래에 카테고리 무관하게 `"청첩장 템플릿"`을 렌더한다. 카테고리 5종인 지금 답례품/방명록 주문서에도 그대로 뜬다. `CheckoutItem`에 카테고리 정보가 없어서 고치려면 `CheckoutItem` 계약 변경이 필요.
- [ ] **상품 상세 페이지의 invitation 전용 안내 문구가 전 카테고리에 하드코딩 노출** (2026-08-07 발견, 목데이터 14건 실등록 검증 중 — 2026-08-12 재확인) — `src/client/components/organisms/ProductSummary.tsx:120,126,132`의 "구매 후 즉시 사용 가능하며, 무제한으로 수정할 수 있습니다" / "평생 호스팅이 포함되어 있어 별도의 유지비가 없습니다" / "모바일과 데스크톱 모두에서 완벽하게 작동합니다"가 캔들홀더 같은 실물 상품 상세페이지에도 카테고리 분기 없이 뜬다. 위 `OrderSummary` 항목과 동일 패턴 — 함께 고친다.
  - 이 컴포넌트는 pure(organisms) 쪽이다. 컨테이너는 `src/app/(main)/(products)/products/[category]/[id]/_components/ProductSummary.tsx`로 분리돼 있으니 둘을 혼동하지 않는다.

### 클러스터 3 — 관리자 등록 폼 (`organisms/ProductRegistrationForm.tsx`, UI섹션 "연속 등록 워크플로우"와 같은 파일 — 함께 처리 권장)

- [ ] **관리자 상품 등록 폼 가격 입력이 `step="1000"` 강제 + 실패 시 무피드백** (2026-08-07 발견, 목데이터 14건 실등록 검증 중 — 2026-08-12 재확인) — `src/client/components/organisms/ProductRegistrationForm.tsx:203`의 `price` input이 `step="1000"`이라 1000원 배수가 아닌 값(예: 4,500원)이 브라우저 네이티브 validation에 걸려 "상품 등록" 클릭이 조용히 씹힌다 — 화면에 에러가 전혀 안 떠서 관리자는 원인을 알 수 없다(재현: 4500원 입력 후 클릭 시 서버 액션 미호출, `element.validity.valid === false`). 답례품처럼 저가·비정형 가격이 흔한 카테고리에 특히 문제 — `step` 완화 또는 커스텀 에러 메시지 노출이 필요.
  - 같은 파일 `:235,318,501,522`에도 `step`이 있다. 가격 외 필드는 의도된 제약일 수 있으니 함께 판단한다.

### 단독 — 연관 항목 없음, 순서 무관

- [ ] **사이드바가 최초 진입 시 관리자 계정도 "일반 계정"으로 잠깐 표시** (2026-08-07 발견 [발견: 목데이터 14건 실등록 워크스루], 2026-08-08 UI 수정 → 버그 수정으로 이동, 2026-08-12 범위 확대) — role 정보가 `/api/auth/me`로 비동기 도착하기 전 기본값이 "일반"이라 관리자에게 순간적으로 오탐 신호를 준다. 기본값을 로딩 스켈레톤이나 빈 상태로 바꾸는 게 안전.
  - **위치 3곳** (TODO에 admin 1곳만 적혀 있었음): `src/app/(admin)/admin/layout.tsx:32`, `src/app/(main)/(my-order)/layout.tsx:25`, `src/app/(main)/(my-profile)/layout.tsx:25` — 전부 `{session?.role === "ADMIN" ? "관리자" : "일반"} 계정` 동일 패턴.
  - **테스트 동반 수정 필요**: 세 layout의 테스트가 `"세션이 없으면 일반 계정으로 표시한다"`로 현재 동작을 스펙으로 못박고 있다(`layout.test.tsx` 각각). 고치려면 이 assertion부터 바꿔야 하고, 그게 곧 Red proof가 된다.
  - **섹션 이동 근거**: 관리자에게 "일반 계정"을 보여주는 건 기존 스펙 위반이라 정답이 이미 있고 회귀 테스트로 못박을 수 있다 — 시각 확인으로 닫는 UI 수정 기준에 맞지 않는다.

- [ ] **존재하지 않는 productId + non-invitation category로 `updateProduct` 호출 시 `NOT_FOUND` 아닌 `INTERNAL`(500) 반환** (2026-08-07 test-suite 발견 — 2026-08-12 원인 확정) — `product.model.ts:101`의 `subCategory` 비동기 validator가 `getQuery()` 폴백으로 기존 문서의 category를 읽는데, 문서가 없으면 `category`가 `undefined`가 되어 `allowed?.includes(value) ?? false`로 무조건 검증 실패한다. 그 ValidationError를 `src/server/services/product.service.ts:286`의 `.catch`가 전부 `AppError("INTERNAL")`로 뭉갠다.
  - 카테고리가 discriminator 없는 4종(favor/accessory/guestbook/ceremony)으로 늘며 새로 열린 경로. 최소조치로는 안 되고 validator나 `.catch` 분기 재설계가 필요하다. 데이터 무결성 문제는 아니고 에러코드 오분류 수준이라 우선순위 낮음.

- [ ] **`npm run test`(bare Vitest 진입점)가 실행 즉시 실패** (2026-08-11 발견 — 2026-08-12 영향 범위 확정) — `Projects "guard" and "integration-client" have different 'maxWorkers' but same 'sequence.groupOrder'`로 테스트 시작 전에 죽는다(2026-08-12 재현). `vitest.config.ts`에서 `guard`는 `maxWorkers: 2`인데 `integration-client`는 미지정(기본값)이라 같은 그룹에서 충돌한다.
  - **영향 범위는 좁다**(2026-08-12 확인): PR CI 7개 job은 전부 project별 명령 또는 `unit-shards.mjs run`을 쓰고, TDD Guard의 Red/Green proof도 `run-vitest.mjs:18`에서 항상 `--project`를 지정한다. mutation 게이트도 무사하다 — `vitest.mutation.config.ts`는 project별 `maxWorkers`가 다르지만 mongo 그룹이 `fileParallelism: false`라 별도 그룹으로 갈려 충돌하지 않는다(unit+server integration 동시 실행으로 실증, 2파일 35테스트 통과).
  - **실사용처는 `.claude/agents/test-suite.md:27` 한 줄**("테스트는 실제로 실행해서(`npm run test`) 통과 확인 후 보고"). 즉 게이트 문제가 아니라 하네스 지침 정합 문제다 — 위 "선행" 첫 항목과 함께 처리하는 편이 낫다.
  - **방향 판단 필요**: (A) project별 `sequence.groupOrder`를 부여해 bare 진입점을 되살릴지, (B) `test` 스크립트를 제거·재정의하고 `test-suite.md`를 실제 명령으로 교정할지. 지금 설정이 project를 쪼갠 이유(샤딩·직렬 mongod)를 보면 B가 설계와 일관된다.
  - **주의**: `vitest.mutation.config.ts`의 무사고는 `fileParallelism` 차이에 기댄 우연이다. 그룹 구성이 바뀌면 같은 오류가 mutation 게이트에서 재발할 수 있다.

---

## 성능 개선

- [ ] **`Product` 복합 인덱스 추가 검토** (2026-08-07 — 2026-08-12 재확인: `_id` 외 인덱스 선언 0개) — 카테고리가 1종→5종으로 늘면서 `category` 필터에 실질적 선택도가 처음 생겼다. 제안: `{deletedAt:1, category:1, isFeatured:-1, priority:-1, createdAt:-1}`(ESR 순서). 이 인덱스는 `category` 지정 호출만 커버하고 전체 목록 경로(category 미지정)는 여전히 in-memory sort라, 두 경로를 다 커버하려면 인덱스 2개가 필요 — 실 데이터 규모를 보고 판단한다.

---

## UI 수정

- [ ] **상품 등록 폼이 연속 등록 워크플로우를 지원하지 않음** (2026-08-07 발견 [발견: 목데이터 14건 실등록 워크스루], 버그수정 클러스터3과 같은 컴포넌트 — 함께 처리 권장, 2026-08-12 재확인) — 등록 성공 시 무조건 `/admin/products` 목록으로 리다이렉트한다(`src/app/(admin)/admin/products/new/_components/ProductRegistrationForm.tsx:27`). 여러 상품을 한 번에 등록하는 시나리오에서 매번 메뉴를 다시 눌러 폼을 처음부터 채워야 한다 — 카테고리/서브카테고리 등 직전 값을 유지한 채 "저장하고 계속 등록" 옵션이 있으면 대량 등록 비용이 크게 준다.

---

## 미분류 인박스

> 작업 브랜치는 **이 구역에만 append**한다. 정식 섹션으로의 분류·이동·완료 체크는 `docs/todo-section-taxonomy` 브랜치에서만 한다.
> 항목 형식: `- [ ] (날짜, 발견 맥락) 증상 — 위치/근거`

- [ ] (2026-08-09, connect.ts 가드를 연결 시점으로 옮기며 발견 — 2026-08-12 재확인 `connect.ts:35`) `connect.ts`의 `testUri ?? srvUri`가 빈 문자열을 "값 있음"으로 취급 — `MONGO_TEST_URI=`처럼 키만 있고 값이 빈 경우 `??`가 폴백하지 않아 `uri`가 빈 문자열이 되고 연결이 원인 불명 에러로 실패한다. `||`로 바꾸면 해소되나 프로덕션 동작 변경이라 별도 판단 필요.
- [ ] (2026-08-10, 변경 테스트 범위 실측 중 발견 — 2026-08-12 근거 갱신) 배럴 강제 규칙의 누적 비용 — `src/` 전체의 `vi.mock("@/...")` 호출이 **112건**이고 그중 배럴 디렉터리를 그대로 mock하는 상위가 `@/server/services` 27, `@/server/actions` 14, `@/client/hooks` 14, `@/client/components/organisms` 8이며, 타입 하나를 배럴로 가져오는 것만으로 TDD Guard의 요구 scope가 `integration`으로 부풀어 오른다(버그수정 "선행" 두 번째 항목과 직결). 규칙 재검토 필요.
- [ ] (2026-08-10, Vitest 실행 로그 점검 중 발견 — 2026-08-12 재확인: 실행당 **6줄**) `vite-tsconfig-paths`가 Vite 네이티브 `resolve.tsconfigPaths: true`로 교체하라는 경고를 매 실행 출력 — 플러그인 제거와 네이티브 설정 전환 검토 필요.
- [ ] (2026-08-11, 공통 TDD Guard 배포 전 검증 완료 후 보류) 배포 환경에 `.env.example`의 운영 필수 값과 `MAIN_PREVIEW_INFO_ID`, `MAIN_PREVIEW_PRODUCT_ID`, `CLOUDINARY_UPLOAD_PRESET`을 등록하고 실제 배포 URL로 Lighthouse 감사를 실행해야 함 — 현재 미배포 상태라 로컬·PR CI 검증 범위에서 제외함.
- [ ] (2026-08-11, KG이니시스 `inicis_v2` 테스트 채널 확정 후 보류) 배포된 HTTPS 환경에서 PortOne 실제 결제 manual smoke를 수행해야 함 — GUI self-hosted runner(`self-hosted`, `linux`, `x64`, `portone-smoke`)와 사람의 카드사 인증으로 12,000원 결제, `PAID` 조회, store/TEST channel/payment ID 검증, 전액 취소 및 `CANCELLED` 재조회를 확인하고 실패 시에도 cleanup을 보장해야 함.
- [ ] (2026-08-11, PortOne webhook 구현 후 배포 검증 보류) 배포 URL을 PortOne webhook으로 등록하고 운영 `PORTONE_WEBHOOK_SECRET`을 설정한 뒤 진위 검증, 멱등 처리 및 주문 상태 반영을 실제 webhook 전달로 확인해야 함 — `src/app/api/webhooks/portone/route.ts` 및 `src/server/services/payment.service.ts`.

### 처리 완료 · 전제 소멸 (2026-08-12 전수 재검증)

- [x] (2026-08-12 완료) `src/shared/AGENTS.md`의 근거 없는 server/client/shared 3분할 배경 문서 참조를 제거.
- [x] (2026-08-12 완료) 소스→테스트 매핑을 `scripts/test-scope/test-graph.mjs`로 통합하고 `scripts/tdd-guard/core/resolve-tests.mjs`에서 사용하도록 정리.
- [x] (2026-08-12 해소 확인) `updateProduct`의 `thumbnail` required 부채 — `src/shared/schemas/request/product.schema.ts:31`이 `File | URL string` union으로 바뀌었고 `updateProduct.ts:45,73`에 `currentThumbnail` 폴백이 있다. 수정 시 썸네일 재업로드 강제가 없다.
- [x] (2026-08-12 해소 확인) `feature-team-orchestrator/SKILL.md:14`의 검증 안내 불일치 — 이미 TDD Guard 계약으로 갱신됨. 단 같은 파일 `:140`은 아직 낡아서 버그수정 "선행" 첫 항목으로 이관.
- [x] (2026-08-12 해소 확인) `embla-carousel-wheel-gestures` 미설치 — 설치돼 있음(로컬 환경 드리프트였음).
- [x] (2026-08-12 전제 소멸) `test:coverage:diff`가 괄호 경로(라우트 그룹)를 커버리지 게이트에서 누락하던 문제(#24) — 커버리지 게이트 자체가 제거됐다. `package.json`에 `test:coverage*` 스크립트가 없고 `vitest.config.ts`에 `coverage` 설정이 없으며, 게이트는 TDD Guard(Red/Green proof) + changed mutation으로 대체됐다.
  - **결함 클래스 재발 없음 확인**: `vitest list --project unit "src/app/(admin)"`이 테스트를 정상 수집한다(위치인자는 substring 매칭이라 괄호가 문제되지 않음). 나아가 `scripts/test-scope/unit-shards.mjs`의 `verifyUnitShards`가 "모든 unit 테스트 파일이 정확히 1개 샤드에 속함"을 CI에서 강제해 침묵 누락 구멍이 구조적으로 막혀 있다.
- [x] (2026-08-12 전제 소멸) 라우트 그룹 컴포넌트 4개의 line coverage 80% 미달 부채 — 커버리지 측정·게이트가 제거되어 기준 자체가 없다. 품질 부채를 다시 재려면 mutation 기준으로 재정의해야 한다.
- [x] (2026-08-12 전제 소멸) Vitest `--coverage.changed`가 unstaged/untracked를 포함하던 관측 항목 — 커버리지 경로 자체가 없다.
- [x] (2026-08-12 정식 섹션 이관) `.git/hooks/commit-msg` prefix 정규식이 전역 `GIT.md` 택소노미와 어긋나던 문제 — 정규식은 2026-08-10에 이미 고쳐졌고, 남은 문제는 그 훅이 저장소 분리 때 tie-knot으로 따라오지 못했다는 것이다. 버그수정 "선행" 세 번째 항목으로 옮김.
- [x] (2026-08-12 불필요 판정) `.claude/hooks/pre-commit-check.sh`가 Git hook이 아니라는 항목 — 파일·디렉터리째 사라졌고 그것이 부르던 `npm run test:paired`도 `package.json`에 없다. 코드 검사 책임은 TDD Guard(에이전트 훅)와 PR CI가 나눠 가지므로 복원하지 않는다. 커밋 규칙 강제는 메시지 검사(`commit-msg`)로만 되살린다.
- [x] (2026-08-12 전제 소멸) WSL 메모리 상한에 맞춘 `maxWorkers: "50%"` 제안 — 현재 `vitest.config.ts`는 project별로 `maxWorkers`를 명시(`guard`/`unit` 2, mongo 계열 1)하는 구조라 제안 내용이 그대로 적용되지 않는다.
