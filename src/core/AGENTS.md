# AGENTS.md — src/core/

> 순수 함수·타입·스키마·정적 콘텐츠 전담. I/O가 없고 src 내부 다른 층을 import하지 않는다.
> Last updated: 2026-08-19

## 공통 디렉토리 컨벤션

파일명은 kebab-case이며 파일 하나는 목적 하나만 담당한다. 폴더 소비자는 개별 구현 파일이 아니라 각 폴더의 `index.ts` 배럴을 사용한다.

## 디렉토리

| 디렉토리 | 담당 | 검증 |
|---|---|---|
| `schemas/` | zod request/response 계약 | lint, tsc, build |
| `domain/` | 도메인 타입·상수 (함수는 두지 않는다 — `utils/`로) | lint, tsc, build |
| `content/` | 정적 JSON 콘텐츠 | lint, tsc, build |
| `utils/` | 순수 함수 — 도메인 무관 헬퍼와 도메인 규칙 계산 | lint, tsc, build |

## 경계

I/O가 있으면 여기 두지 않는다. 외부 SDK를 감싸면 런타임에 따라 `src/adapters/server/{서비스명}/` 또는 `src/adapters/browser/{서비스명}/`, DB 접근이면 `src/db/` 또는 `src/models/`로 보낸다.

순수 함수라도 mongoose 같은 서버 전용 패키지에 의존하면 두지 않는다. 기준은 함수의 부수효과뿐 아니라 의존 대상이 클라이언트 번들에 포함돼도 안전한가다.
