# AGENTS.md — src/ui/components/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 shadcn/ui 기반 컴포넌트와 Atomic Design 컴포넌트를 관리한다.

## Layer boundaries

- 의존 방향은 `ui → atoms → molecules → organisms → templates`이다.
- 현재 계층은 자신보다 왼쪽에 있는 계층만 import할 수 있다.
- 하위 계층에서 상위 계층을 import하지 않는다.
- 같은 계층의 컴포넌트끼리 결합하기보다 공통 책임을 더 낮은 계층으로 추출한다.
- 순환 의존성을 만들지 않는다.
- `ui`는 shadcn/ui primitive 관리 영역이며 Atomic 계층으로 분류하지 않는다.

## Component rules

- 컴포넌트는 역할이 드러나는 구체적인 이름을 사용한다. `Common`, `Custom`, `Reusable` 같은 이름은 사용하지 않는다.
- 재사용 컴포넌트에 API 호출, 라우팅, 전역 스토어 접근을 숨기지 않는다. 필요한 값과 이벤트는 props로 전달한다.
- 도메인 규칙이 포함되면 범용 컴포넌트처럼 위장하지 말고 도메인 이름을 사용한다.
- 기존 디자인 토큰, variant 체계, 접근성 패턴을 우선 사용한다.
- 공개 API는 각 컴포넌트 폴더의 `index.ts`에서 명시적으로 export한다.
- 타입은 가능한 한 컴포넌트 가까이에 두고, 여러 파일에서 공유할 때만 별도 타입 파일로 분리한다.
- `data-testid`보다 role, accessible name, label을 사용하는 테스트를 우선한다.

## Change discipline

- 수정 전에 대상 컴포넌트의 사용처와 현재 public API를 확인한다.
- 요청 범위 밖의 shadcn/ui 원본이나 인접 계층을 일괄 변경하지 않는다.
- 새 추상화를 만들기 전에 실제로 반복되는 사용 사례가 있는지 확인한다.
- 변경 후 저장소에 정의된 lint, typecheck, test 명령 중 관련된 검증을 실행한다.
- 저장소에 없는 명령이나 도구를 임의로 가정하지 않는다.

## Structure

```text
src/ui/components/
├─ AGENTS.md
├─ ui/
│  └─ AGENTS.md
├─ atoms/
│  └─ AGENTS.md
├─ molecules/
│  └─ AGENTS.md
├─ organisms/
│  └─ AGENTS.md
└─ templates/
   └─ AGENTS.md
```

소비자는 계층 폴더를 지정해 import한다(`@/ui/components/{tier}/{Name}`).

## 관련 문서

- Pages, private 폴더, layout 경계: `src/app/AGENTS.md`
- 공통 import 경로와 네이밍 규칙: `src/AGENTS.md`
