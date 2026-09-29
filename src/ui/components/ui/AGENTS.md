# AGENTS.md — src/ui/components/ui/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 shadcn/ui에서 추가하거나 동기화한 범용 primitive를 관리한다.

## Responsibilities

- Button, Table, Checkbox처럼 도메인 의미가 없는 기반 UI만 둔다.
- shadcn/ui의 구성 방식과 public API를 가능한 한 유지한다.
- 스타일 변경은 기존 CSS 변수, 디자인 토큰, variant 체계를 사용한다.
- 접근성 속성, ref 전달, keyboard interaction을 보존한다.

## Boundaries

- `atoms`, `molecules`, `organisms`, `templates`를 import하지 않는다.
- 비즈니스 용어, API 응답 타입, 라우팅, 전역 상태를 참조하지 않는다.
- 여러 primitive를 조합한 프로젝트 고유 표현은 `atoms` 이상으로 이동한다.
- 정렬, 검색, 페이지네이션 같은 제품 기능을 구현하지 않는다.

## Editing rules

- 변경 전에 해당 파일이 shadcn/ui 원본인지 프로젝트 커스텀 버전인지 확인한다.
- 원본 수정이 필요하면 변경 이유와 영향을 사용처 기준으로 확인한다.
- 특정 화면만을 위한 스타일을 primitive variant로 추가하지 않는다.
- 새 dependency는 primitive 구현에 꼭 필요한 경우에만 추가한다.

## Structure

```text
src/ui/components/ui/
├── button.tsx
├── dialog.tsx
├── table.tsx
└── ...
```

완전한 flat 구조를 유지하고, 소비자는 파일을 직접 지정해 import한다(`@/ui/components/ui/button`). variant 함수·스타일 유틸·내부 훅은 shadcn/Radix 원본 컨벤션을 따라 camelCase 또는 `use` + PascalCase로 유지한다(`buttonVariants`, `useSidebar`).

## 관련 문서

- 공통 판정 순서와 계층 경계: `src/ui/components/AGENTS.md`
- ui를 감싸는 다음 계층: `src/ui/components/atoms/AGENTS.md`
