# AGENTS.md — src/ui/components/

> Last updated: 2026-08-31

## Overview

이 프로젝트는 Brad Frost의 Atomic Design에서 pages를 제외한 atoms, molecules, organisms, templates 네 티어를 사용한다. pages 역할은 `src/app/**/page.tsx`가 담당한다.

티어 판정은 축 A(컴포넌트의 역할)와 축 B(공용 폴더인지 라우트 로컬인지)를 분리해서 수행한다. **이 문서와 각 티어의 `AGENTS.md`가 판정 기준의 유일한 진실 소스다.** 별도 메모나 과거 배치 사례를 기준으로 삼지 않는다.

## 축 A — 티어 판정

다음 순서로 판정하고, 앞 단계에서 결론이 나면 뒤 단계는 적용하지 않는다.

1. `page.tsx`가 페이지 몸통 전체를 위임하는 컴포넌트인지 확인한다. 맞으면 조합 재료나 동작 수와 무관하게 template이다.
2. shadcn/Radix CLI 산출물인지 확인한다. 맞으면 내부 복잡도나 동작 수와 무관하게 atom이다.
3. 우리가 작성한 코드라면 표시, 입력, 검증, 삭제, 탐색처럼 사용자가 인식하는 동작 종류를 센다. 두 종류 이상이면 조합 수와 무관하게 organism이다.
4. 동작이 한 종류라면 프로젝트 UI 컴포넌트 조합 수를 본다. 조합이 없으면 atom, 하나 이상이면 molecule이다.

| 조건                               | 판정     |
| ---------------------------------- | -------- |
| 페이지 몸통 전체를 위임받음        | template |
| shadcn/Radix CLI 산출물            | atom     |
| 우리 코드, 조합 0개, 동작 1종      | atom     |
| 우리 코드, 조합 1개 이상, 동작 1종 | molecule |
| 우리 코드, 동작 2종 이상           | organism |

props로 받은 핸들러를 그대로 전달하는 상호작용도 동작으로 센다. 예를 들어 라벨 표시와 `onChange` 전달을 함께 하는 `TextField`는 표시와 입력 두 종류의 동작을 가지므로 organism이다. 반대로 CSS grid처럼 무엇을 조합하는지가 아니라 배치 방식만 반복하는 코드는 티어 컴포넌트로 만들지 않고 소비처에 배치 클래스를 둔다.

## 축 B — 공용 여부

축 A로 티어를 정한 다음 물리적 위치를 판단한다. 소비처 수는 직접 import 수가 아니라 최종 렌더되는 라우트 수를 전이적으로 센다.

- 최종 소비 라우트가 2곳 이상이면 `src/ui/components/{tier}/`의 공용 컴포넌트 후보가 된다.
- 최종 소비 라우트가 1곳이면 해당 라우트의 `_components/`에 둔다. 데이터 페칭, mutation, 도메인 로직을 소유하면 `_containers/`에 둔다.
- 유일한 직접 소비자가 이미 여러 라우트에서 쓰이는 공용 컴포넌트라면 그 하위 구현도 공용 티어 폴더에 둘 수 있다.
- `page.tsx`와 `layout.tsx` 소비를 동일하게 라우트 소비로 센다.

atoms, molecules, organisms, templates는 모두 props 기반의 순수한 표현 컴포넌트다. 데이터 페칭, Server Actions, mutation, 도메인 로직을 두지 않는다. 도메인 타입과 리터럴 상수를 참조하기 위한 `@/core/domain` import는 허용한다.

## 현재 판정 예시

| 컴포넌트                    | 실측 근거                             | 판정     |
| --------------------------- | ------------------------------------- | -------- |
| `app-image.tsx`             | 프로젝트 UI 조합 0개, 이미지 표시 1종 | atom     |
| `Alert.tsx`                 | Typography 조합, 상태 메시지 표시 1종 | molecule |
| `TextField.tsx`             | 라벨·오류 표시와 입력 전달            | organism |
| `RatingStars.tsx`           | 별점 표시와 입력                      | organism |
| `LegalDocumentTemplate.tsx` | terms/privacy 페이지 몸통 전체 위임   | template |

## Structure

```text
src/ui/components/
├── atoms/       # 외부 산출물 또는 조합 없는 단일 동작 프리미티브
├── molecules/   # 프로젝트 UI를 조합한 단일 동작 단위
├── organisms/   # 두 종류 이상의 동작을 묶은 구획
└── templates/   # 페이지 몸통 전체 구조
```

각 폴더는 flat 구조와 `index.ts` 배럴을 유지한다. 파일명 규칙과 세부 예시는 각 티어의 `AGENTS.md`를 따른다.

## 관련 문서

- 라우트 로컬 `_components/`와 `_containers/`, page/layout 경계: `src/app/AGENTS.md`
- 공통 배럴 import와 네이밍 규칙: `src/AGENTS.md`
