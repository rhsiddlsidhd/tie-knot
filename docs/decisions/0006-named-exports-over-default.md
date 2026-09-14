# ADR-0006: src/ 전역 named export 강제와 Next.js 파일 컨벤션 예외

- 상태: Proposed
- 결정일: 2026-09-14
- 적용 범위: `src/**/*.{ts,tsx}`

## 맥락

`src/AGENTS.md`는 "src/ 안 파일은 export default를 쓰지 않는다"는 규칙을 문서로만 선언했고, 이를 기계적으로 검사하는 도구는 없었다. `src/app/AGENTS.md`가 나열하던 예외 목록(`page.tsx`/`layout.tsx`/`loading.tsx`/`error.tsx`/`not-found.tsx`/`template.tsx`/`default.tsx`)도 Next.js 파일 컨벤션 전수조사 결과와 어긋났다 — 리포에 실존하는 `global-error.tsx`가 목록에서 빠져 있었고, `forbidden.tsx`/`unauthorized.tsx`/`global-not-found.tsx`/아이콘·OG 이미지·`manifest.ts`/`robots.ts`/`sitemap.ts` 등 Next.js가 지원하지만 아직 안 쓰는 컨벤션도 반영되지 않았다.

같은 시기 병합된 컴포넌트 파일명/폴더명 컨벤션 검증(#279, `eslint-plugin-check-file`)이 선례를 남겼다 — 코드 리뷰에 맡기던 명명 규칙을 `npm run lint`로 기계 검사화했고, 아직 안 쓰는 레이아웃(컴포넌트별 디렉토리)에 대한 규칙도 "지금은 아무것도 안 걸리지만 그 구조를 쓰는 순간 바로 작동하는" 휴면 상태로 먼저 넣어뒀다. export default 규칙도 같은 방식으로 다뤄야 한다는 근거가 됐다.

## 결정

`src/` 트리 전역에 named export를 기본으로 강제하고, Next.js가 파일 컨벤션으로 default export를 요구하는 라우팅 트리 파일에만 예외를 둔다. 예외 목록은 임의로 추리지 않고 Next.js 공식 문서(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/`)의 라우팅 파일 컨벤션을 전수조사해 확정한다 — 지금 리포에 없는 컨벤션(`forbidden.tsx`, 메타데이터 파일군 등)도 나중에 쓰면 바로 작동하도록 먼저 포함한다. 예외 목록의 단일 원본은 `src/app/AGENTS.md`이며, 그 목록이 실제 Next.js 컨벤션과 계속 일치하는지는 이 ADR이 아니라 그 문서와 코드 리뷰가 책임진다.

`route.ts`(HTTP 메서드 named export 강제)와 `proxy.ts`(default/named 둘 다 허용하지만 프로젝트는 named를 택함)는 애초에 이 규칙의 예외 대상이 아니다 — 기본 named export 강제와 자연히 일치한다.

## 검토한 대안

### 커스텀 검증 스크립트 (`check-no-barrels.mjs` 방식)

배럴 검사처럼 AST/정규식을 직접 파싱하는 스크립트를 새로 짠다. `export default` 유무 판정은 성숙한 eslint 규칙이 이미 존재해, 범용 규칙이 없어 직접 파싱이 필요했던 barrel 검사(디렉터리명·재수출 대상 교차검증)와 달리 재발명할 이유가 없다. 기각.

### 강제 파일에 default export가 "있는지"도 함께 검증

누락 시 Next.js 빌드/런타임이 즉시 실패하므로 별도 정적 검사가 주는 한계효용이 낮고, 검증 대상만 두 배로 늘어난다. 기각.

### PostToolUse hook으로 에이전트 작업 직후 즉시 검사

`npm run lint`가 이미 CI(`ci(static)`)에서 push마다 돈다 — 사람과 에이전트 모두 PR 단계서 동일하게 걸린다. 에이전트 전용 즉시 피드백 루프를 얻는 대신 기존 TDD gate(`tooling/tdd-gate/hook.mjs`) 실행 경로에 lint를 얹는 복잡도가 추가된다. 지금은 CI 피드백으로 충분하다고 보고 보류 — 필요해지면 별도 이슈로 재검토.

## 결과

`src/` 전역의 named export 위반이 `npm run lint`/CI 단계에서 기계적으로 잡힌다. 강제 파일 예외 목록이 Next.js 공식 컨벤션 전수조사에 기반해 명시적으로 관리되므로, `src/app/AGENTS.md`의 예외 목록과 실제 강제 규칙이 어긋나는 문제(이번에 발견된 `global-error.tsx` 누락 같은)가 재발하면 eslint 규칙과 문서 양쪽에서 동시에 드러난다. 현재 리포의 `export default` 사용 44개 파일을 전수 스캔한 결과 전부 예외 목록 안에 있어 규칙 도입 시점의 회귀는 없다. 잔여 위험은 Next.js가 새 파일 컨벤션을 추가했을 때(이번 조사의 `global-not-found.js`는 아직 experimental) 예외 목록 갱신이 뒤늦어지는 것이며, 이는 `src/app/AGENTS.md` 갱신과 코드 리뷰가 가드한다.

## 관련 이력

- (구현 PR 링크는 병합 후 추가)
