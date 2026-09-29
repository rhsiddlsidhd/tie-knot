# AGENTS.md — src/ui/components/templates/

> Last updated: 2026-09-29

## Overview

이 디렉터리는 페이지의 구조와 슬롯 배치를 정의하는 재사용 레이아웃을 관리한다.

## Responsibilities

- header, filters, content, actions, pagination 같은 페이지 영역의 배치를 정의한다.
- organism을 조합하고 페이지가 콘텐츠를 주입할 수 있는 slots 또는 children API를 제공한다.
- 예: `LegalDocument`, `ListPage`, `DetailPage`.

## Boundaries

- `ui`, `atoms`, `molecules`, `organisms`를 import할 수 있다.
- 실제 API 호출, 라우트 파라미터 해석, 권한 판정, 도메인 데이터 변환을 수행하지 않는다.
- 실제 사용자명, 상품명 같은 화면별 콘텐츠를 하드코딩하지 않는다.

## Layout rules

- 데이터보다 레이아웃과 콘텐츠 위치를 props로 표현한다.
- responsive layout과 주요 landmark 구조를 책임진다.
- 특정 페이지에서만 쓰이는 조건 분기가 늘어나면 template API를 확장하기보다 route 또는 feature entry에서 조합한다.

## Structure

```text
src/ui/components/templates/
├── LegalDocument/
│   ├── LegalDocument.tsx
│   ├── LegalDocument.component.test.tsx
│   └── index.ts
└── ...
```

컴포넌트마다 동일 이름 디렉토리를 두고 export 이름은 PascalCase로 짓는다.

공용 templates 계층은 폴더가 계층을 드러내므로 `Template` 접미사를 붙이지 않는다(`ListPage`, `LegalDocument`). 라우트 `_components/{Name}Template.tsx`는 계층 폴더가 없어 접미사가 유일한 표시이므로 `src/app/AGENTS.md` 규칙을 그대로 따른다.

## 관련 문서

- 공통 판정 순서와 계층 경계: `src/ui/components/AGENTS.md`
- Pages, private 폴더, layout 경계: `src/app/AGENTS.md`
