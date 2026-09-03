# AGENTS.md — src/ui/hooks/

> Last updated: 2026-08-26

## Overview

프로젝트 자체 로직 React 커스텀 훅 전담, 외부 SDK 결합 훅은 제외.

## Structure

```
src/ui/hooks/
├── useAuth.ts             # SWR fetch 전담(`/api/auth/me`) — 서버 세션은 Zustand로 옮기지 않는다, `src/AGENTS.md` Critical Convention 참고
├── useInvitationForm.ts     # 주문별 청첩장 편집 오케스트레이션
└── ...                       # 훅 1개당 파일 1개
```

## Critical Convention

- 파일명은 camelCase, `use` 접두사 필수 — 데이터 페칭 훅은 도메인을 PascalCase로 이어붙이고(`useCoupleInfo.ts`), 페칭 외 공유 로직 훅은 목적을 PascalCase로 이어붙인다(`useCountdown.ts`).
- **"use client" 지시어를 파일 최상단에 고정한다 — 예외 없다.** 훅은 정의상 React hook을 호출하므로 client 전용이다. 호출하는 쪽 컴포넌트가 이미 client 경계 안이라서 괜찮겠거니 하고 생략하지 않는다 — 경계 선언이 없으면 이 파일을 (직접이든 다른 client 모듈을 거쳐서든) 참조하게 되는 Server Component에서 빌드 에러가 나고, 그 시점에는 원인이 이 파일이라는 사실이 드러나지 않는다.
- 외부 SDK를 초기화하는 훅(`useKakaoLoader` 등)을 여기 두지 않는다 — 훅이라도 연동 대상 하나에 강결합돼 있으면 `src/adapters/browser/{service}/`의 "연동 대상 1개 = 폴더 1개" 소관이다(`src/adapters/AGENTS.md` 참고).

## 관련 문서

- 외부 SDK 초기화 훅의 실제 위치(adapters와의 배치 경계): `src/adapters/AGENTS.md`
