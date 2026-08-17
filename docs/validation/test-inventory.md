# 테스트 인벤토리

> 기준: 2026-08-17, 디렉토리 재구성과 Actions 슬림화 이후

## 실행 단위

| 명령 | 파일 | 테스트 | 환경·경계 |
|---|---:|---:|---|
| `npm run test:unit` | 20 | 166 | Node, 순수 로직·Action/API 계약 |
| `npm run test:component` | 89 | 318 | jsdom, UI·Hook·브라우저 Adapter |
| `npm run test:integration` | 13 | 199 | 실제 MongoDB replica set, 직렬 실행 |
| `npm test` | 122 | 683 | 전체 Vitest project |
| `npm run test:e2e` | 1 | 7 | Playwright core 시나리오 |

파일·테스트 수는 현재 기준선이며 새 동작 추가에 따라 늘어날 수 있다. 분류와 명령 계약이 기준이고 숫자 자체를 고정하지 않는다.

## 이번 재분류에서 제거한 중복

Actions 슬림화 이전 테스트 21개 파일은 Action에서 bcrypt, JWT, Cloudinary, DB Service 내부 호출을 직접 mock했다. 해당 책임이 유스케이스 Service로 이동한 뒤 이 테스트는 공개 계약이 아니라 삭제된 구현을 검증하게 되었으므로 제거했다.

Action 범위는 `workflow-delegation.test.ts`에서 입력 검증, 유스케이스 위임, `AppError` 변환, 캐시 갱신을 검증한다. 인증·회원 업무 규칙은 service integration, 상품 등록·수정과 주문·결제 흐름은 service integration 및 Playwright core에서 검증한다.

## 인프라 결정

- TypeScript alias는 Vite 내장 `resolve.tsconfigPaths`를 사용한다.
- `server-only`는 Vitest 해석 단계에서만 빈 shim으로 치환한다.
- MongoDB integration은 단일 replica set을 공유하고 파일 병렬 실행을 금지한다.
- MongoDB와 DOM이 모두 필요한 파일은 integration project 안에서 `@vitest-environment jsdom`을 선언한다.
- CI 필수 체크는 현재 `static` 하나다. 테스트 체크 승격은 별도 승인 사항이다.
