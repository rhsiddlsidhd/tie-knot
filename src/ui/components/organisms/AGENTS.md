# AGENTS.md — src/ui/components/organisms/

> Last updated: 2026-08-31

## Overview

`organisms/`는 표시, 입력, 검증, 삭제, 탐색처럼 사용자가 인식하는 동작을 두 종류 이상 묶은 순수 컴포넌트를 모아둔다. 프로젝트 UI 조합 수는 보조 지표이며, 동작이 두 종류 이상이면 조합이 없어도 organism이다.

props로 주입받은 핸들러를 하위 요소에 전달하기만 해도 해당 상호작용을 동작으로 센다. 이 규칙을 적용하지 않으면 핸들러를 props로 받는 순수 컴포넌트 대부분이 표시 한 종류로 잘못 축소된다.

## 현재 예시

| 파일                  | 동작 근거                    |
| --------------------- | ---------------------------- |
| `TextField.tsx`       | 라벨·오류 표시와 입력 전달   |
| `ClipboardButton.tsx` | 아이콘 표시와 복사 클릭 전달 |
| `RatingStars.tsx`     | 별점 표시와 별점 입력        |
| `BankField.tsx`       | 은행 선택과 계좌번호 입력    |
| `BottomActionBar.tsx` | 가시성 표시와 제출 전달      |

`RatingStars.tsx`처럼 프로젝트 UI 조합이 0개여도 동작이 두 종류면 atom이 아니라 organism이다.

## Structure

```text
src/ui/components/organisms/
├── index.ts
├── BankField.tsx
├── ClipboardButton.tsx
├── FormField.tsx
├── RatingStars.tsx
├── TextField.tsx
└── ...
```

## Critical Convention

- 완전한 flat 구조를 유지하고 하위 폴더를 만들지 않는다.
- 파일명과 export 이름은 PascalCase로 짓는다.
- 도메인 로직, 데이터 페칭, Server Actions, mutation을 두지 않는다. 해당 로직은 라우트의 `_containers/`가 소유하고 organism에는 props로 전달한다.
- 최종 소비 라우트가 한 곳이면 해당 라우트의 `_components/`에 두고, 2곳 이상일 때 공용 폴더로 승격한다.
- 여러 도메인이나 라우트에서 쓰는 구현은 특정 소비처 이름을 피하고 역할 중심으로 이름 짓는다.

## 관련 문서

- 공통 판정 순서와 공용 여부: `src/ui/components/AGENTS.md`
- 라우트 컨테이너 배치: `src/app/AGENTS.md`
