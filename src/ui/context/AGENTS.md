# AGENTS.md — src/ui/context/

> Last updated: 2026-08-26
> 이 폴더는 프로젝트 고유 선택 — 전역 상태 관리 레이어.

## Overview

`context/`는 여러 위치(라우트/컴포넌트 트리)가 공유해야 하는 React Context 기반 클라이언트 상태를 모아둔다 — 전역이지만 Zustand로 옮길 만큼 앱 전체 범위는 아니고, 특정 도메인/UI 트리에 한정된 상태(예: 상품 필터)에 쓴다.

## Structure

```
src/ui/context/
├── index.ts                  # 배럴 — export * from "./createStateContext"
├── createStateContext.tsx   # Provider+useContext 페어를 만드는 제네릭 팩토리(도메인 무관)
└── {domain}/                  # 팩토리를 실제로 쓰는 도메인 폴더(예: productFilter/)
    ├── index.ts                # 이 도메인 전용 배럴
    ├── type.ts                # State/Action 타입
    ├── reducer.ts              # 초기값 선언 + 순수 reducer((state, action) => newState)
    └── provider.tsx            # createStateContext(reducer 기반 useValue) 호출 결과로 Provider/hook export — 고유 로직 추가 금지
```

## Critical Convention

- 새 Context 도메인을 추가할 때 `createStateContext.tsx`를 직접 복붙해 새 팩토리를 만들지 않는다 — 기존 팩토리를 import해서 쓴다(제네릭이라 도메인 무관 재사용 가능).
- 도메인 폴더 안 파일은 `type.ts`/`reducer.ts`/`provider.tsx`로 고정한다 — 폴더명이 이미 도메인을 특정하므로 파일명에 도메인명을 반복하지 않는다(`productFilter/productFilterType.ts` 금지).
- `reducer.ts`(초기값+순수 reducer)와 `provider.tsx`(`createStateContext` 호출)를 분리한다 — `provider.tsx`엔 이 호출 외 다른 로직을 추가하지 않는다. 이 경계로 `reducer.ts`는 항상 테스트 후보(분기 있는 경우), `provider.tsx`는 항상 테스트 배제로 판정한다.

## 관련 문서

- 전역 상태(Zustand)와의 경계: `src/ui/stores/AGENTS.md` — 앱 전체 범위면 Context가 아니라 Zustand(`src/ui/stores/`)로 간다.
