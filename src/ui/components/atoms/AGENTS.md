# AGENTS.md — src/ui/components/atoms/

> Last updated: 2026-08-31

## Overview

`atoms/`는 shadcn/Radix CLI 산출물과, 프로젝트 UI 컴포넌트를 조합하지 않고 한 종류의 동작만 제공하는 커스텀 프리미티브를 모아둔다.

shadcn/Radix CLI 산출물은 내부에 여러 하위 요소와 상호작용이 있어도 atom이다. 우리가 작성한 컴포넌트는 프로젝트 UI 조합이 0개이고 동작이 한 종류일 때만 atom이다. 동작이 두 종류 이상이면 조합이 없어도 organism으로 판정한다.

## 현재 예시

| 파일                       | 근거                                            |
| -------------------------- | ----------------------------------------------- |
| `button.tsx`, `dialog.tsx` | shadcn/Radix 산출물                             |
| `typography.tsx`           | 프로젝트 UI 조합 없이 텍스트 표시               |
| `app-image.tsx`            | 프로젝트 UI 조합 없이 이미지 또는 fallback 표시 |

`app-image.tsx`의 로드 실패 fallback도 이미지 표시라는 같은 동작 안의 상태 변화이므로 동작 종류를 늘리지 않는다.

## Structure

```text
src/ui/components/atoms/
├── index.ts
├── app-image.tsx
├── button.tsx
├── dialog.tsx
├── typography.tsx
└── ...
```

## Critical Convention

- 완전한 flat 구조를 유지하고 하위 폴더를 만들지 않는다.
- 파일명은 소문자 kebab-case로 짓고 export 이름은 PascalCase를 사용한다.
- 도메인 로직, 데이터 페칭, Server Actions, mutation을 두지 않는다.
- 프로젝트 UI 컴포넌트를 하나라도 조합하면 동작 수를 다시 센 뒤 molecule 또는 organism으로 이동한다.
- 공간 배치만 추상화하는 wrapper를 만들지 않는다. 배치 클래스는 소비처가 소유한다.

## 관련 문서

- 공통 판정 순서와 공용 여부: `src/ui/components/AGENTS.md`
- 조합이 시작되는 다음 티어: `src/ui/components/molecules/AGENTS.md`
