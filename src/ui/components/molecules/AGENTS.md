# AGENTS.md — src/ui/components/molecules/

> Last updated: 2026-08-31

## Overview

`molecules/`는 프로젝트 UI 컴포넌트를 하나 이상 조합하면서 사용자가 인식하는 동작은 한 종류인 순수 컴포넌트를 모아둔다. 완성품인지 골격인지는 판정 기준이 아니다.

props로 받은 핸들러를 전달하는 상호작용도 동작으로 센다. 따라서 표시와 입력, 표시와 삭제처럼 동작이 두 종류가 되면 조합이 단순해도 organism이다.

## 현재 예시

| 파일              | 조합                        | 동작             |
| ----------------- | --------------------------- | ---------------- |
| `Alert.tsx`       | Typography                  | 상태 메시지 표시 |
| `ProductCard.tsx` | AppImage, Badge, Typography | 상품 요약 표시   |

`TextField`와 `FormField`는 현재 `organisms/`에 있다. 이름에 `Field`가 붙었는지, 바로 사용할 수 있는지는 molecule 판정 근거가 아니다.

## Structure

```text
src/ui/components/molecules/
├── index.ts
├── Alert.tsx
├── AutoCompleteList.tsx
├── BaseSelect.tsx
├── CursorPagination.tsx
└── ProductCard.tsx
```

## Critical Convention

- 완전한 flat 구조를 유지하고 하위 폴더를 만들지 않는다.
- 파일명과 export 이름은 PascalCase로 짓는다.
- 도메인 로직, 데이터 페칭, Server Actions, mutation을 두지 않는다.
- 최종 소비 라우트가 한 곳이면 해당 라우트의 `_components/`에 두고, 2곳 이상일 때 공용 폴더로 승격한다.
- 유일한 직접 소비자가 이미 여러 라우트에서 쓰이는 공용 컴포넌트라면 그 하위 molecule은 이 폴더에 둘 수 있다.

## 관련 문서

- 공통 판정 순서와 공용 여부: `src/ui/components/AGENTS.md`
- 두 종류 이상의 동작을 다루는 티어: `src/ui/components/organisms/AGENTS.md`
