# AGENTS.md — src/ui/components/organisms/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 여러 atom과 molecule을 조합한 독립적인 UI 영역을 관리한다.

## Responsibilities

- 여러 하위 컴포넌트의 상태와 상호작용을 조율한다.
- 예: `DataTable`, `InputField`, `BankField`, `RatingStars`.
- 로딩, 빈 상태, 오류 표시처럼 해당 UI 영역에 필요한 상태 표현을 제공한다.

## Boundaries

- `ui`, `atoms`, `molecules`를 import할 수 있다.
- `templates`를 import하지 않는다.
- 범용 organism은 API 호출, 라우팅, 전역 스토어에 직접 접근하지 않는다.
- 도메인 전용 organism은 이름에 도메인을 표시하고, 데이터 변경은 명시적인 callback 또는 주입된 adapter를 통해 요청한다.
- 페이지 전체 레이아웃이나 라우트 책임을 포함하지 않는다.

## DataTable rules

- shadcn/ui의 `Table` primitive는 직접 대체하지 않고 내부 구성 요소로 사용한다.
- 정렬, 필터, 선택, 페이지네이션은 controlled state를 우선 지원한다.
- 컬럼 정의와 row 데이터 타입은 generic으로 유지한다.
- toolbar, pagination, empty state는 교체하거나 숨길 수 있는 명확한 API를 제공한다.
- loading, empty, error 상태의 우선순위를 일관되게 처리한다.
- 대규모 데이터의 서버 페이지네이션과 클라이언트 페이지네이션을 혼합하지 않는다.
- 테이블 구조가 비대해지면 toolbar, header, pagination 등의 molecule로 분리한다.

## Structure

```text
src/ui/components/organisms/
├── InputField/
│   ├── InputField.tsx
│   ├── InputField.component.test.tsx
│   └── index.ts
└── ...
```

컴포넌트마다 동일 이름 디렉토리를 두고 export 이름은 PascalCase로 짓는다.

## 관련 문서

- 공통 판정 순서와 계층 경계: `src/ui/components/AGENTS.md`
- 라우트 컨테이너 배치: `src/app/AGENTS.md`
