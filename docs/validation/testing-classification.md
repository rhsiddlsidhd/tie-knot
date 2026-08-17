# 테스트 분류

테스트는 사용하는 라이브러리가 아니라 실제로 통과하는 경계로 분류한다. 공개 taxonomy는 unit, component, integration, E2E 네 가지다.

## 결정 기준

### Unit

하나의 주된 대상을 프로세스 밖 자원이나 실제 애플리케이션 경계 없이 격리해 검증한다. 핵심 의존성을 대체하고 한 함수의 분기만 확인한다면 unit이다.

- 파일명: `*.test.ts` 또는 `*.test.tsx`
- 위치: 대상 제품 코드 옆의 `src/`; Guard 도구 테스트는 대상 코드 옆의 `scripts/`

### Integration

둘 이상의 실제 프로젝트 경계를 연결하거나 실제 테스트 인프라를 통과해 계약의 연결을 검증한다. service→MongoDB, action→service→MongoDB, hook→SWR→fetch→MSW가 해당한다. 외부 서비스만 mock해도 내부 경계를 실제로 연결하면 integration이다.

- 파일명: `*.integration.test.ts` 또는 `*.integration.test.tsx`
- 위치: 대상 제품 코드 옆의 `src/`
- 한 파일에 integration 사례가 하나라도 있으면 파일 전체를 integration으로 분류한다. Vitest의 분류 단위는 개별 `it`이 아니라 파일이다.

### Component

jsdom에서 React 컴포넌트와 Hook의 렌더링·상호작용 계약을 검증한다. DB나 실행 중인 애플리케이션은 사용하지 않는다.

- 파일명: `*.test.ts` 또는 `*.test.tsx`
- 위치: `src/ui/`, UI를 소유한 `src/app/`, 브라우저 Adapter

`integration-component`는 실제 내부 경계를 연결하지만 MongoDB를 사용하지 않는 jsdom integration을 component 명령에 함께 제공하는 실행용 project다. 공개 분류명은 파일 접미사가 결정한다.

### E2E

실행 중인 애플리케이션을 실제 브라우저로 조작해 사용자 시나리오를 검증한다.

- 파일명: `*.spec.ts`
- 위치: `testing/e2e/`

## 배치 원칙

- unit과 integration 테스트는 대상 코드 옆에 둔다. 별도 디렉터리에 `src/` 구조를 복제하지 않는다.
- `testing/support/`는 공용 setup, DB helper, factory 전용이며 테스트 파일을 두지 않는다.
- Playwright E2E만 특정 소스 파일이 아닌 사용자 시나리오를 대상으로 하므로 `testing/e2e/`에 둔다.
- 실행을 가르지 않는 `*.regression.test.ts` 같은 설명용 접미사를 만들지 않는다. 파일명 접미사는 실행 셀렉터다.

## 범위 선택

- 순수 schema·utility는 unit으로 시작한다.
- Action unit은 FormData 검증, 단일 유스케이스 위임, 응답 변환과 캐시 갱신만 검증한다. Service 내부 Adapter·DB 호출을 Action 테스트에서 다시 mock하지 않는다.
- DB 쿼리, 인증·인가, 결제 금액·소유권처럼 경계를 관통하는 동작은 해당 경계를 실제로 연결한 integration으로 검증한다.
- 선언적 Mongoose schema만을 위한 별도 모델 테스트는 만들지 않는다. 실제 DB를 쓰는 service integration이 스키마 계약을 함께 검증한다. 커스텀 validator 같은 제품 로직은 그 로직을 사용하는 service에서 검증한다.
- 얇은 Route Handler가 이미 검증된 service 계약을 그대로 전달한다면 중복 테스트를 피한다. HTTP status나 응답 envelope처럼 route 고유 계약이 있으면 route 경계에서 검증한다.
