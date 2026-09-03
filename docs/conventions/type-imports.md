# 타입 import/export 규칙

> Last updated: 2026-08-12

## 규칙

- 타입/인터페이스는 `import type { X } from "..."`으로 가져온다 — 값 구문(`import { X }`)으로 가져오지 않는다. `@typescript-eslint/consistent-type-imports`(`prefer: "type-imports"`, `fixStyle: "separate-type-imports"`)가 강제하고 autofix한다.
- 타입만 재수출하는 선언은 `export type { X }`로 쓴다 — `export { X }`로 두면 소비자가 `import type`을 써도 재수출한 파일이 값 경로를 유지해 런타임 의존 사슬이 안 끊긴다. `@typescript-eslint/consistent-type-exports`가 강제하고 autofix한다. 이 규칙은 타입 정보가 필요해 `parserOptions.projectService: true`가 따라붙는다 — lint가 느려지면(현재 `src/**` 기준 약 10초) 범위를 좁히는 것부터 검토한다.
- `tsconfig.json`의 `verbatimModuleSyntax: true`가 위 두 규칙의 잔여·재발을 `npm run tsc`(TS1484) 단계에서 봉쇄한다. eslint autofix가 못 미치는 곳(예: `next.config.ts`처럼 lint 스코프 밖 파일, `importOriginal<typeof import("...")>()`처럼 제네릭 인자 안에 박힌 `import()` 타입 쿼리)은 이 단계에서 걸러 수동으로 고친다.
- `importOriginal<typeof import("...")>()` 같은 vitest 모킹 패턴은 정적 `import type`으로 못 바꾼다(제네릭 인자라 top-level import 문이 아니다) — `import type * as XModule from "..."`을 선언하고 `importOriginal<typeof XModule>()`로 참조한다.

## 왜 필요한가

타입을 값 구문으로 가져오면 런타임 의존이 불필요하게 남아 번들 경계와 순환 참조를 흐린다. `import type`과 `export type`을 명시하면 TypeScript가 타입 전용 의존을 제거하고, 실제 런타임 의존 방향만 코드에 남는다.

## 재수출 주의

`src/`는 배럴을 두지 않고 심볼이 정의된 파일을 직접 지정해 import한다(`src/AGENTS.md`, `docs/decisions/0004-explicit-module-paths-over-barrels.md`). 그래도 한 파일이 다른 파일의 타입을 다시 내보내는 경우는 남는다 — 그때 값 구문으로 재수출하면 그 파일을 참조하는 모든 소비자의 그래프에 불필요한 런타임 의존이 실린다. 재수출 대상이 타입 전용인지 먼저 확인하고 `export type`으로 쓴다.
