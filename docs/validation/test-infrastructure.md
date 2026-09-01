# 테스트 인프라

이 문서는 Vitest 실행 환경과 공유 자원의 제약을 설명한다. project의 정확한 include/exclude와 worker 값은 `vitest.config.ts`, 공개 명령은 `package.json`을 단일 소스로 삼는다.

## Vitest project

- `unit`: actions, core, 서버/순수 adapter, API 경계의 `*.unit.test.ts`를 Node에서 실행한다.
- `component`: ui, app UI, 브라우저 adapter의 `*.component.test.ts(x)`를 jsdom에서 실행한다. MongoDB 없이 Hook·컴포넌트 경계를 관통하는 파일(예: Hook → SWR → fetch → MSW)도 이 접미사로 여기 속한다 — `docs/__test/component.md` 참고.
- `integration`: `test/integration/`의 `*.integration.test.ts(x)`로 actions/db/services/API와 DB를 관통하는 계약을 실행한다. 단일 replica set을 공유하므로 파일을 직렬 실행한다. jsdom이 필요한 파일은 `@vitest-environment jsdom`을 선언한다.

루트 설정은 `@next/env`로 환경 파일을 로드하고 Vite의 `resolve.tsconfigPaths`로 TypeScript alias를 해석한다. `server-only`는 테스트 전용 빈 shim으로 해석하되 제품 코드의 서버 경계는 변경하지 않는다.

## MongoDB

`test/support/setup/mongo-server.ts`의 global setup은 단일 노드 replica set을 하나 띄우고 `MONGO_TEST_URI`를 설정한다. replica set과 WiredTiger는 transaction을 실제 조건에 가깝게 검증하기 위한 제약이다. mongod 버전은 이 setup 파일에서 고정하며 운영 버전 변경 시 함께 검토한다.

여러 DB 테스트 파일이 같은 인스턴스를 공유하므로 integration은 파일을 순차 실행한다. 각 테스트의 `beforeEach`에서 `clearCollections`로 관련 상태를 비운다는 격리 전략은 이 순차 실행을 전제로 한다. DB project의 파일 병렬 실행을 켜면 한 파일의 정리가 다른 파일의 데이터를 지울 수 있다.

## 공개 명령

- `npm run test:unit`: Node unit
- `npm run test:component`: jsdom component(MSW 기반 client data flow 포함)
- `npm run test:integration`: MongoDB integration
- `npm test`: 전체 Vitest project
- `npm run test:e2e`: Playwright core 시나리오

`dbConnect()`는 연결 시점에 테스트 URI를 선택하고 검증해야 한다. 모듈 로드 시점에 DB 환경을 요구하면 MongoDB를 띄우지 않는 unit 테스트도 배럴 import만으로 실패한다.

## jsdom

`test/support/setup/jsdom-polyfill.ts`는 렌더 cleanup과 jsdom에 없는 브라우저 API를 보완한다. 전역을 변경하므로 setup 진입점에서만 불러오고 `@test/support` 배럴에 export하지 않는다. 폴리필은 브라우저 환경 가드 안에 추가해 Node project를 오염시키지 않는다.

현재 Radix와 파일 입력 테스트에 필요한 Pointer Capture, `scrollIntoView`, `ResizeObserver`, `DataTransfer` 및 파일 목록 동작이 이 setup에 모여 있다. 새 폴리필은 실제 제품 의존성이 요구할 때만 추가한다.

## Factory와 지원 자산

- `test/support/factories/`는 도메인별 유효한 기본 입력을 제공한다.
- schema 필수 필드가 바뀌면 factory 한 곳에서 기본값을 갱신한다.
- `test/support/setup/`은 설정 전용, `test/support/db.ts`는 DB 격리 helper, `test/support/index.ts`는 테스트 코드용 공개 배럴이다.
- `test/support/`에는 테스트 파일을 두지 않는다.
