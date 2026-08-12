<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 프로젝트 개요

웨딩 관련 상품을 취급하는 이커머스 플랫폼. 모바일 청첩장 템플릿을 시작으로, 답례품·웨딩 소품·방명록 굿즈·예식 용품 등 결혼 준비 과정에서 필요한 상품군으로 확장 가능한 구조를 지향한다.

> 현재 구현된 상품 카테고리는 모바일 청첩장 하나다.

## 하네스: 풀스택 기능 구현 팀

**목표:** API/UI/DB 설계 팬아웃 → 구현+상주 경계면 검증 → 통합 테스트로 이어지는 5-Phase 파이프라인으로 신규 기능을 처음부터 끝까지 구현.

**트리거:** 새 엔드포인트·화면·데이터모델이 동시에 얽히는 신규 기능 요청 시 `feature-team-orchestrator` 스킬을 사용하라. 재실행·부분 수정·보완 요청도 동일 스킬. 단순 버그 수정·1~2파일 변경엔 쓰지 않는다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-07-31 | 초기 구성 (agent 7개 + skill 2개) | 전체 | 풀스택 기능 구현 자동화 요청 |
| 2026-07-31 | git 통합 — 브랜치 `{domain}/{name}` 재정의(git prefix/슬러그), Phase0 브랜치확정, Phase2+3 워크트리 격리+유닛단위 커밋+리더전용 병합, Phase5 PR자동생성(merge는 항상 사람), 스코프 `feat` 전용 명시 | feature-team-orchestrator/SKILL.md, backend-impl.md, frontend-impl.md | GIT 워크플로우 그릴링 세션 확정 반영. 선행조건: pre-commit coverage 기존 부채(9개 파일) 해소 별도 필요 |

---

## Cross-cutting References (Lazy Loading)

- 데이터 접근 경로를 선택하거나 Server Component·Server Action·Route Handler 사이의 경계를 변경할 때는 먼저 `docs/architecture/data-access.md`를 끝까지 읽는다.
- services·Server Actions·Route Handlers·클라이언트에 걸친 에러 처리 흐름, 분류 또는 응답 채널을 변경할 때는 먼저 `docs/architecture/error-handling.md`를 끝까지 읽는다.
- 인증·인가, 세션, Proxy 또는 `page.tsx` 접근 제어를 변경할 때는 먼저 `docs/security/page-access-control.md`를 끝까지 읽는다.
- 새 라우트 세그먼트의 이름을 정하거나 기존 세그먼트 이름을 변경할 때는 먼저 `docs/conventions/route-naming.md`를 끝까지 읽는다.
- 테스트를 추가·수정하거나 unit/integration/E2E를 분류할 때는 먼저 `docs/validation/testing-classification.md`와 `docs/validation/testing-practices.md`를 끝까지 읽는다.
- Vitest·Playwright·MongoDB·jsdom·factory 등 테스트 인프라를 변경할 때는 먼저 `docs/validation/test-infrastructure.md`를 끝까지 읽는다.
- TDD Guard의 정책·명령·구현을 변경할 때는 먼저 `docs/validation/tdd-guard.md`를 끝까지 읽는다.
- mutation testing의 범위·정책·명령을 변경할 때는 먼저 `docs/validation/mutation-testing.md`를 끝까지 읽는다.
- CI workflow나 브랜치 보호·필수 체크를 변경할 때는 먼저 `docs/validation/ci-gates.md`를 끝까지 읽는다.
- import 구문을 추가·수정하거나 배럴(`index.ts`)의 재수출을 바꿀 때는 먼저 `docs/conventions/type-imports.md`를 끝까지 읽는다.

---

## Git

- TODO.md 정리·갱신은 `docs/todo-section-taxonomy` 브랜치에서 한다. 매 사이클 `git switch -C docs/todo-section-taxonomy origin/dev`로 새로 따고, 머지 후에는 다른 브랜치와 동일하게 삭제한다 — 재사용하는 건 이름뿐이다. 브랜치를 살려두면 squash merge 탓에 매 사이클 dev와 갈라진 상태에서 출발하게 된다.

- 목적 밖 발견의 배출구는 TODO.md의 "미분류 인박스"다 — 작업 브랜치는 여기에만 append한다. 정식 섹션의 재분류·이동·완료 체크는 TODO 브랜치에서만 한다. 이동과 수정이 겹치면 머지가 못 푼다.
