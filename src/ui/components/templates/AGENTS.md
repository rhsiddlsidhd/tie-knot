# AGENTS.md — src/ui/components/templates/

> Last updated: 2026-08-31

## Overview

`templates/`는 `page.tsx`가 페이지 몸통 전체를 위임하는 순수 컴포넌트를 모아둔다. template은 organism의 복잡한 버전이 아니라 페이지 범위를 소유하는 별도 티어다.

페이지 범위는 다른 모든 판정 축보다 우선한다. atom만 사용하거나 동작이 한 종류뿐이어도 페이지 몸통 전체를 담당하면 template이다. template이 반드시 molecule이나 organism을 재료로 사용해야 한다는 조건은 없다.

## 현재 예시

`LegalDocumentTemplate.tsx`는 terms와 privacy 두 `page.tsx`가 제목, 시행일, 섹션 데이터만 전달하고 페이지 몸통 전체를 위임하므로 공용 template이다.

## Structure

```text
src/ui/components/templates/
├── index.ts
├── LegalDocumentTemplate.tsx
└── ...                        # {Name}Template.tsx — 페이지 몸통 전체를 공유하는 라우트가 2곳 이상일 때 추가
```

## Critical Convention

- 완전한 flat 구조를 유지하고 하위 폴더를 만들지 않는다.
- 파일명과 export 이름은 PascalCase + `Template` 접미사로 짓는다.
- 데이터 페칭, Server Actions, mutation, 도메인 로직을 두지 않고 완성된 콘텐츠를 props로 받는다.
- 한 라우트만 사용하는 template은 해당 라우트의 `_components/`에 두고, 의도적으로 같은 전체 배치를 공유하는 라우트가 2곳 이상일 때 이 폴더로 승격한다.
- `page.tsx` 추출 기준과 `layout.tsx` 경계는 `src/app/AGENTS.md`를 따른다.

## 관련 문서

- 공통 판정 순서와 공용 여부: `src/ui/components/AGENTS.md`
- Pages, private 폴더, layout 경계: `src/app/AGENTS.md`
