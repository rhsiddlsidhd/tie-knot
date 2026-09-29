# AGENTS.md — src/ui/components/molecules/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 하나의 작고 명확한 사용자 과업을 수행하는 UI 조합을 관리한다.

## Responsibilities

- `ui`와 `atoms`를 조합해 단일 기능을 제공한다.
- 예: `TableSearch`, `TableColumnHeader`, `TablePagination`, `TableEmptyState`.
- 입력과 출력이 props와 callback으로 명확히 드러나게 한다.

## Boundaries

- `ui`와 `atoms`만 import한다.
- `organisms`, `templates`를 import하지 않는다.
- 서버 데이터 fetching, 라우트 전환, 전역 스토어 접근을 직접 수행하지 않는다.
- 여러 독립 기능을 조율하거나 넓은 화면 영역을 책임지면 `organisms`로 이동한다.

## State and behavior

- focus, open state, 입력 중인 값처럼 컴포넌트 내부에 국한된 UI 상태만 소유한다.
- 검색 실행, 페이지 변경 같은 제품 동작은 callback으로 상위에 전달한다.
- 특정 테이블 라이브러리 타입에 불필요하게 결합하지 않는다.
- keyboard와 screen reader 사용 흐름을 함께 검증한다.

## Structure

```text
src/ui/components/molecules/
├── TableShell/
│   ├── TableShell.tsx
│   ├── TableShell.component.test.tsx
│   └── index.ts
└── ...
```

컴포넌트마다 동일 이름 디렉토리를 두고 export 이름은 PascalCase로 짓는다.

## 관련 문서

- 공통 판정 순서와 계층 경계: `src/ui/components/AGENTS.md`
- 두 종류 이상의 동작을 다루는 다음 계층: `src/ui/components/organisms/AGENTS.md`
