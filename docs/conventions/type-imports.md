# 타입 import/export 규칙

> Last updated: 2026-08-12

## 규칙

- 타입/인터페이스는 `import type { X } from "..."`으로 가져온다 — 값 구문(`import { X }`)으로 가져오지 않는다. `@typescript-eslint/consistent-type-imports`(`prefer: "type-imports"`, `fixStyle: "separate-type-imports"`)가 강제하고 autofix한다.
- 배럴(`index.ts`)에서 타입만 재수출하는 선언은 `export type { X }`로 쓴다 — `export { X }`로 두면 소비자가 `import type`을 써도 배럴 자체가 값 경로를 유지해 런타임 의존 사슬이 안 끊긴다. `@typescript-eslint/consistent-type-exports`가 강제하고 autofix한다. 이 규칙은 타입 정보가 필요해 `parserOptions.projectService: true`가 따라붙는다 — lint가 느려지면(현재 `src/**` 기준 약 10초) 범위를 좁히는 것부터 검토한다.
- `tsconfig.json`의 `verbatimModuleSyntax: true`가 위 두 규칙의 잔여·재발을 `npm run typecheck`(TS1484) 단계에서 봉쇄한다. eslint autofix가 못 미치는 곳(예: `next.config.ts`처럼 lint 스코프 밖 파일, `importOriginal<typeof import("...")>()`처럼 제네릭 인자 안에 박힌 `import()` 타입 쿼리)은 이 단계에서 걸러 수동으로 고친다.
- `importOriginal<typeof import("...")>()` 같은 vitest 모킹 패턴은 정적 `import type`으로 못 바꾼다(제네릭 인자라 top-level import 문이 아니다) — `import type * as XModule from "..."`을 선언하고 `importOriginal<typeof XModule>()`로 참조한다.

## 왜 필요한가

TDD Guard가 "이 파일을 고치면 어떤 종류의 테스트가 필요한가"를 **런타임 import 전이 그래프**로 산정한다(`scripts/tdd-guard/core/classify-scope.mjs`의 `requiredScopePolicy`). 타입을 값 구문으로 가져오면 그래프가 그 사슬을 런타임 의존으로 오인해, 순수 프레젠테이셔널 컴포넌트에도 mongod를 띄우는 integration 테스트를 요구한다.

`classify-scope.mjs`는 TS AST로 런타임 specifier만 추출하므로 판정기 자체는 타입 import를 이미 걸러낸다 — 문제는 소스에 `import type` 표기가 없어서 판정기가 걸러낼 대상 자체가 없었다는 것이다. 이 규칙 3층(autofix + 배럴 정리 + `verbatimModuleSyntax`)을 적용해 실측한 효과:

| 시점 | `src/**/*.{ts,tsx}` 중 integration 요구 | 비율 |
| --- | --- | --- |
| 적용 전 | 308/410 | 75.1% |
| 적용 후 | 262/410 | 63.9% |

기대만큼 극적이지 않다 — 46개 파일(11.2%p)만 줄었다. 나머지 262개는 타입이 아니라 실제 값(함수·컴포넌트)을 통해 `src/server/actions/*` 같은 파일을 거쳐 DB/외부 서비스에 진짜로 닿는 경로라서, import 구문을 고쳐도 안 끊긴다 — 이건 설계상 정상이다(경계가 실재하면 integration 요구가 맞다).

## 배럴 재수출 주의

`src/` 컨벤션상 폴더 내부 파일은 개별 경로가 아니라 `index.ts` 배럴로만 import한다(`src/AGENTS.md`). 배럴이 타입을 값 구문으로 재수출하면 그 폴더를 경유하는 모든 소비자의 그래프가 오염된다 — 새 배럴을 만들거나 기존 배럴에 export를 추가할 때는 재수출 대상이 타입 전용인지 먼저 확인하고 `export type`으로 쓴다.
