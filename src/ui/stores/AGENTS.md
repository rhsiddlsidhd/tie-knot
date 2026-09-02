# AGENTS.md — src/ui/stores/

> Last updated: 2026-09-01
> 이 폴더는 프로젝트 고유 선택 — 전역 클라이언트 상태(Zustand) 레이어.

## Overview

Zustand(`node_modules/zustand`, v5) 기반 앱 전체 범위 클라이언트 상태 레이어. **결합된 store 하나**(slices 패턴, 공식 가이드 `flux-inspired-practice.md` "Single store")를 **요청/마운트당 인스턴스화**(`zustand/vanilla` `createStore` + Context, 공식 가이드 `nextjs.md` "No global stores")한다. `StoreProvider`는 `src/app/layout.tsx`(root layout)에서 한 번 마운트해 모든 라우트 그룹에 공급한다. 특정 UI 트리에만 한정된 상태는 여기가 아니라 `src/ui/context/`(`src/ui/context/AGENTS.md` 참고).

## Structure

```
src/ui/stores/
├── app.store.ts                 # createAppStore — 아래 slices/ 전부 spread해 결합, persist는 여기 한 곳에서만(order 슬라이스만 partialize)
├── provider.tsx                 # "use client" — useState(() => createAppStore())로 요청/마운트당 1개 생성, Context.Provider
├── use-app-store.ts             # useContext + useStore(store, selector) — 소비 훅, 기존 useXStore(selector) 시그니처 유지
└── slices/
    ├── order.slice.ts           # createOrderSlice — 도메인 데이터 상태
    ├── admin-modal.slice.ts     # createAdminModalSlice — 모달 UI 상태(필드 접두사로 충돌 회피, 아래 Critical Convention)
    └── guestbook-modal.slice.ts # createGuestbookModalSlice — 모달 UI 상태(동일)
```

`slices/`는 항상 `createXSlice(set, get) => ({...})` 형태의 순수 상태 전이 함수만 담는다 — React import 금지. `app.store.ts`/`provider.tsx`/`use-app-store.ts`는 결합·배선만 하고 자체 분기를 두지 않는다. 이 경계로 `slices/`는 항상 테스트 후보(계산 있는 슬라이스만), 루트 3개 파일은 항상 테스트 배제로 판정한다.

## Critical Convention

- **단일 결합 store(slices 패턴)** — 공식 가이드(`flux-inspired-practice.md`): "Your applications global state should be located in a single Zustand store." 도메인별 `createXSlice(set, get) => ({...})` 함수로 쪼개고, `app.store.ts`에서 `createStore<AppStore>()((...a) => ({ ...createOrderSlice(...a), ...createAdminModalSlice(...a), ... }))`로 결합한다(공식 가이드 `slices-pattern.md`). 미들웨어(`persist` 등)는 슬라이스 각각이 아니라 **결합 지점에만** 적용한다 — 공식 가이드: "you should only apply middlewares in the combined store. Applying them inside individual slices can lead to unexpected issues."
- **필드명이 슬라이스 간 충돌하면 접두사로 구분한다** — `admin-modal.slice.ts`/`guestbook-modal.slice.ts` 둘 다 `isOpen`/`type`/`closeModal`을 쓰므로 결합 store에서는 `adminModalIsOpen`/`guestbookModalIsOpen`, `adminModalType`/`guestbookModalType`, `closeAdminModal`/`closeGuestbookModal`로 접두사를 붙인다. 충돌 없는 필드(`props`, `payload`, `openModal`, `setIsOpen`, `clearIsOpen`)는 그대로 둔다.
- **`use-app-store.ts`의 `useOrderStore`/`useAdminModalStore`/`useGuestbookModalStore`는 접두사 붙은 결합 store 필드를 도메인별 옛 필드명(`isOpen`/`type`/`closeModal`)으로 투영해 selector에 넘긴다** — 그래서 소비 컴포넌트(예: `AdminModal.tsx`)는 접두사를 몰라도 되고 마이그레이션 전 selector 코드를 그대로 쓴다. `useGuestbookModalStore`는 selector 생략 시 이 투영된 뷰 객체를 통째로 반환하는 기본 identity selector를 쓴다(`GuestbookModal.tsx`의 `useGuestbookModalStore()` 무인자 호출 유지 목적).
- **`create()` 대신 `zustand/vanilla`의 `createStore` + React Context로 store를 요청/마운트당 인스턴스화한다** — 공식 가이드(`nextjs.md`): "No global stores - Because the store should not be shared across requests, it should not be defined as a global variable." `createAppStore()` 팩토리 함수 + `"use client"` Provider(`useState(() => createAppStore())`로 최초 1회만 생성) + 소비 훅(`useContext`+`useStore(store, selector)`) 3단 구성을 쓴다. `StoreProvider`는 테스트에서 미리 만든 store 인스턴스를 주입할 수 있게 `store?: AppStoreApi` prop을 받는다 — 요청당 인스턴스화 이후엔 모듈 레벨 `getState()`/`setState()`가 없으므로, 실제 store를 쓰는 테스트는 `createAppStore()`로 만든 인스턴스를 `<StoreProvider store={testStore}>`로 주입하고 `testStore.getState()`로 arrange/assert한다(전체 `@/ui/stores` 모듈을 mock하는 테스트는 해당 없음).
- **React Server Component/Server Action은 이 store를 읽거나 쓰지 않는다** — 공식 가이드(`nextjs.md`): "React Server Components should not read from or write to the store." RSC는 hook/context를 못 쓰므로 애초에 구조적으로 강제된다.
- **TypeScript는 항상 curried `create<State>()(...)`(슬라이스는 `StateCreator`) 형태로 쓴다** — 공식 문서(`README.md` TypeScript Usage): "Basic typescript usage doesn't require anything special except for writing `create<State>()(...)` instead of `create(...)`." 미들웨어를 나중에 추가해도 타입이 깨지지 않는 유일한 형태다.
- **컴포넌트에서 store를 구독할 땐 항상 selector를 쓴다** — `useAppStore((state) => state.field)`. selector 없이 전체 상태를 꺼내면 그 컴포넌트가 store의 모든 변경에 리렌더된다(공식 문서 "Fetching everything" 경고: "it will cause the component to update on every state change").
- **여러 필드를 객체/배열로 한 번에 select할 땐 `useShallow`(`zustand/react/shallow`)로 감싼다** — v5부터 selector 결과의 얕은 비교가 자동이 아니다, 감싸지 않으면 매 렌더마다 새 객체/배열이 만들어져 selector가 매번 다른 값으로 보여 리렌더가 안 걸러진다(공식 문서 "Selecting multiple state slices" 참고).
- 액션 안에서 현재 상태를 읽어야 하면 클로저 대신 `get()`을 쓴다 — `(set, get) => ({ ... })`(공식 문서 "Read from state in actions"). `set`은 기본적으로 얕은 merge라 일부 필드만 갱신할 땐 나머지를 직접 스프레드할 필요 없다 — 전체 교체가 필요할 때만 `set(newState, true)`(두 번째 인자)를 쓴다, 이때 다른 슬라이스 필드까지 날아갈 수 있으니 결합 store에선 특히 주의(공식 문서 "Overwriting state").
- 전부 named export로 통일한다 — `src/AGENTS.md`의 `src/` 전체 default export 금지 규칙 참고.

## 관련 문서

- 특정 UI 트리 한정 상태와의 경계: `src/ui/context/AGENTS.md`
