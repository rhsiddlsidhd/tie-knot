# AGENTS.md — src/ui/

> Last updated: 2026-08-26

## Overview

`components`/`hooks`/`stores`/`context`/`constants`/`utils`/`fetcher.ts` — "누가 import하는가" 기준으로 브라우저에서만 도는 코드를 모은 최상위 폴더. 외부 브라우저 SDK 연동은 `src/adapters/browser/{service}/`에 둔다.

## Key Files

| File         | Purpose                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `fetcher.ts` | `useSWR` 전용 — `src/boundary.ts` route 응답 envelope 파싱, 실패 시 `ErrorPayload`로 정규화해서 throw |

## Structure

```
src/ui/
├── components/   # atoms/molecules/organisms/templates — src/ui/components/AGENTS.md
├── hooks/        # 프로젝트 자체 로직 커스텀 훅(외부 SDK 결합 훅 제외) — src/ui/hooks/AGENTS.md
├── stores/       # 전역 클라이언트 상태(Zustand) — src/ui/stores/AGENTS.md
├── context/      # 특정 도메인/UI 트리 한정 React Context 상태 — src/ui/context/AGENTS.md
├── constants/    # 2개 이상 UI 소비처가 공유하는 브라우저 전용 상수(현재 코드 없음)
├── utils/        # 브라우저 전용 side-effect 유틸 목표 위치(아직 코드 없음, 외부 SDK는 adapters/browser/ 소관)
└── fetcher.ts    # Key Files 참고.
```

## Critical Convention

- **Server Action은 `fetcher` 계약 대상이 아니다.** Server Action의 실패는 `fetcher`/`boundary.ts` envelope를 거치지 않고 `useActionState` state(`ErrorPayload`)로 직접 내려온다 — `fetcher`를 Server Action 호출에 쓰지 않는다(`ErrorPayload` 타입 자체는 `src/core/types` 공유 계약이다).
  - `fetcher`가 던진 에러든 action이 리턴한 `ErrorPayload`든, 클라이언트는 서버가 준 shape을 그대로 렌더할 뿐 판단하지 않는다 — 상세 규칙(useSWR/useActionState 렌더 패턴)은 `docs/architecture/error-handling.md` §채널 C 참고.
- `fetcher` 밖에서 client-side fetch를 직접 만들지 않는다 — envelope 파싱/에러 정규화가 `fetcher`에 집중돼있으므로 우회하면 각자 다른 파싱 로직을 재구현하게 된다. GET 조회는 `useSWR`+`fetcher`, mutation은 Server Action이라 클라이언트에 그 외 fetch가 없다.
- 서버 전용 코드(DB 드라이버, `next/headers` 등)를 이 트리에 두지 않는다 — 새 서버 전용 코드는 `src/`.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                | 위치                  | 트리거                                         | 요약                     |
| ------------------- | --------------------- | ---------------------------------------------- | ------------------------ |
| `AGENTS.md`         | `src/`         | Route Handler 응답 계약(`boundary.ts`) 확인 시 | 성공/에러 응답 빌더 계약 |
| `AGENTS.md`         | `src/actions/` | 이 계약에서 제외된 Server Actions 확인 시      | Server Action 리턴 계약  |
| `AGENTS.md`         | `src/app/api/`        | 이 계약을 쓰는 Route Handlers 확인 시          | Route Handler 컨벤션     |
| `AGENTS.md`         | `src/core/types/`   | 응답/에러 타입 원본 확인 시                    | `types/error.ts`         |
