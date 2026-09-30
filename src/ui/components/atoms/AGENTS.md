# AGENTS.md — src/ui/components/atoms/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 프로젝트에서 의미를 갖는 최소 UI 단위를 관리한다.

## Responsibilities

- 하나의 시각적 또는 의미적 책임만 가진 컴포넌트를 둔다.
- `ui` primitive를 프로젝트 디자인 언어로 감싼 컴포넌트를 둔다.
- 예: `AppImage`, `Typography`, `Logo`, `DateDisplay`.

## Boundaries

- `ui`와 외부 UI 라이브러리만 import할 수 있다.
- `molecules`, `organisms`, `templates`를 import하지 않는다.
- API 호출, 라우팅, 전역 스토어, 복잡한 폼 상태를 사용하지 않는다.
- 여러 사용자 동작이나 독립된 UI 영역을 포함하면 `molecules`로 이동한다.

## API design

- 데이터 원본보다 표현에 필요한 최소 props를 받는다.
- 가능한 한 controlled component로 작성한다.
- 도메인 값의 표시 규칙을 포함한다면 이름에 그 의미를 드러낸다.
- 임의의 boolean props를 계속 추가하기보다 명확한 variant를 사용한다.

## Structure

```text
src/ui/components/atoms/
├── app-image.tsx
├── date-display.tsx
├── logo.tsx
├── typography.tsx
└── ...
```

완전한 flat 구조를 유지하고 하위 폴더를 만들지 않는다. 파일명은 kebab-case, export는 PascalCase를 쓴다(`app-image.tsx` → `AppImage`).

## 관련 문서

- 공통 판정 순서와 계층 경계: `src/ui/components/AGENTS.md`
- 감싸는 대상: `src/ui/components/ui/AGENTS.md`
- 조합이 시작되는 다음 계층: `src/ui/components/molecules/AGENTS.md`
