# ADR-0008: 컴포넌트 티어 list 스타일 named export 강제

- 상태: Accepted
- 결정일: 2026-09-14
- 적용 범위: `src/ui/components/`

## 맥락

named export는 두 가지 동등한 문법으로 쓸 수 있다 — `export const X = ...`처럼 선언에 export를 바로 붙이는 inline 방식과, `const X = ...; export { X };`처럼 선언과 export 문을 분리하는 list 방식이다. 컴포넌트 24개를 컴포넌트별 디렉토리로 옮기며 살펴보니 이 둘이 무작위로 섞여 있었다 — 절반은 list(`Alert.tsx`, `TextField.tsx` 등), 절반은 inline(`ProductCard.tsx`, `ClipboardButton.tsx` 등)이었다.

shadcn/Radix CLI 산출물(`atoms/`)은 export 개수와 무관하게 항상 list 스타일이다. 이 프로젝트가 이미 atoms 티어에서 shadcn 컨벤션을 그대로 따르기로 한 것([atoms/AGENTS.md](../../src/ui/components/atoms/AGENTS.md))과 같은 결로, molecules/organisms/templates도 list 스타일로 통일한다.

두 스타일이 의미상 완전히 동등하고(같은 모듈 바인딩을 만든다) 도구로 강제 가능하다는 것도 실측했다 — ESLint 코어 규칙 `no-restricted-syntax`에 `ExportNamedDeclaration[declaration!=null]` 셀렉터를 걸면 inline export(`export const/function/interface X`)만 정확히 골라내고, list 스타일(`export { X }`, 배럴의 `export { X } from "./X"`)은 건드리지 않는다. `import/group-exports`(export가 2개 이상일 때만 발동)와 달리 export 개수와 무관하게 걸린다.

## 결정

`src/ui/components/` 안의 모든 `.ts`/`.tsx` 파일은 named export를 선언과 분리해서 파일 하단에 `export { X };`(값), `export type { Y };`(타입) 형태로 모은다. `eslint.config.mjs`의 `no-restricted-syntax` 규칙(`ExportNamedDeclaration[declaration!=null]`)이 이를 강제한다. 배럴(`index.ts`)의 `export { X } from "./X"`는 `declaration`이 없는 별개 AST 노드라 이 규칙과 무관하게 항상 허용된다.

## 검토한 대안

### `import/group-exports`로 대체

이미 로드된 플러그인이라 추가 설정이 필요 없다는 장점이 있지만, export가 하나뿐인 파일(이 프로젝트 컴포넌트 대다수)에는 발동하지 않는다 — "합칠 대상이 없다"는 이유로 inline 단독 export를 그대로 허용한다. 이번 결정의 목적(개수 무관 통일)과 맞지 않아 기각.

### 현행 유지 (스타일 혼재 허용)

동작에 차이가 없으니 신경 쓰지 않는 선택지도 있었지만, 파일마다 export 위치가 달라 훑어볼 때 "이 파일의 공개 API가 뭔지" 한눈에 안 들어오는 비용이 이미 24개 파일에서 실제로 발생했다. 기각.

## 결과

새/기존 컴포넌트 파일은 전부 `no-restricted-syntax`가 통과할 때까지 list 스타일로 작성해야 한다. 대가는 함수 하나짜리 파일도 선언과 export 문 두 줄로 늘어나는 것뿐이다. 이 규칙은 `src/ui/components/`에만 적용된다 — `src/actions/`·`src/services/`처럼 다른 곳은 각자 카멜케이스 export가 정상이라 이 스타일 강제 대상이 아니며, 확장하려면 해당 디렉토리에서 별도로 검토해야 한다.

## 관련 이력

(없음)
