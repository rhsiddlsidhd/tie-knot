# AGENTS.md — src/ui/components/organisms/

> Last updated: 2026-07-18

## Overview

`organisms/`는 molecules(및/또는 atoms, 다른 organisms)를 조합해 만든, 여러 책임을 묶은 복잡한/뚜렷이 구분되는 화면 섹션을 모아두는 곳이다 — molecules와 동일하게 순수(presentational)해야 하며 도메인 로직·데이터 페칭·Server Actions은 두지 않는다(`src/ui/components/AGENTS.md` 핵심 원칙 1). 도메인 로직이 필요한 화면은 라우트의 `_components/{Name}.tsx`(컨테이너)가 이 순수 organism을 import해서 props(데이터/핸들러)를 채워 넣는 방식으로 만든다 — 예: `_components/LoginForm.tsx`(컨테이너)가 `organisms/Form.tsx`(순수)에 필드 설정·onSubmit·에러를 props로 전달.

molecules와의 경계는 "완성됐냐"가 아니라 "단순한가 복잡한가"다(핵심 원칙 3, 원본 Atomic Design 기준) — molecule은 단일 책임의 단순 단위, organism은 그런 단순 단위 여러 개(+atom)를 묶어 만든 복잡한 구획이다(예: `BasicInfoForm.tsx` = 필드 여러 개(molecule)를 묶고 제출 로직까지 아우르는 폼 섹션).

## Structure

```
src/ui/components/organisms/
├── index.ts                        # 배럴 — export *
└── {Name}.tsx                        # 완성된 화면 섹션(순수, props 기반)
```

## Critical Convention

- 파일명/export는 PascalCase.
- 소비자가 라우트 1곳뿐인 organism을 미리 여기로 승격하지 않는다 — 도메인 결합 여부와 무관하게, 순수한 완성품 자체가 2개 이상의 라우트/컨테이너에서 재사용될 때만 여기 둔다(`src/ui/components/AGENTS.md` 컨테이너 승격 규칙). 유일한 소비자가 라우트가 아니라 이미 공유 중인 다른 organism/molecule이면 이 규칙 대상이 아니다(같은 예외는 `src/ui/components/AGENTS.md` 참고).
- 여러 도메인 타입을 동시에 다루거나 2곳 이상에서 재사용되는 구현체의 추상 네이밍 규칙은 `src/AGENTS.md` 참고(이 폴더 전용 규칙 아님, 교차 컨벤션).

## Gotchas

- `InvitationFormView`는 청첩장 전체 편집 UI이고 `CoupleInfoSection`은 그 안의 신랑·신부 정보 섹션이다 — 엔티티·편집 흐름에는 `Invitation`, 실제 커플 정보 구획에만 `CoupleInfo`를 사용한다.

## References

즉시 로드(`@import`) 아님 — 트리거 열 키워드에 해당하는 작업일 때만 해당 문서를 읽는다.

| 문서                   | 위치                                | 트리거                             | 요약                          |
| ---------------------- | ------------------------------------ | ----------------------------------- | ----------------------------- |
| `AGENTS.md`            | `src/app/`                           | 컨테이너(도메인 로직) 승격 규칙 확인 시 | 컨테이너 및 승격 규칙     |
| `AGENTS.md`            | `src/ui/components/molecules/`   | 조합 재료 확인 시                   | molecule 정의                 |
