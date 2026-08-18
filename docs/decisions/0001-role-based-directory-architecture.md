# ADR-0001: 역할 기반 디렉터리 아키텍처

- 상태: Accepted
- 결정일: 2026-08-17
- 적용 범위: `src/`

## 맥락

초기 `src/`는 기능 코드와 기술 폴더가 혼재해 서버 전용 코드, 브라우저 코드와 공용 코드를 경로만으로 구분하기 어려웠다. 2026-07-23의 커밋 `2499913`에서 이를 `server/`, `client/`, `shared/`로 재배치했다. 이 첫 번째 이동은 실행 환경을 분명하게 하고 서버 코드의 클라이언트 유입을 줄이는 데 필요했다.

프로젝트가 커지자 런타임 축만으로는 코드의 역할과 검증 방식을 설명할 수 없었다. 같은 `server/` 아래에 Action, 비즈니스 규칙, Mongoose Model, DB 연결과 외부 SDK가 공존했고, 같은 `lib/` 안에서도 준비물 없는 로컬 연산, SDK mock이 필요한 연동, 실제 MongoDB가 필요한 코드가 섞였다. UI가 DB 표현에서 타입을 가져오고 Vitest project가 역할 대신 과거 경로 패턴에 의존하는 문제도 생겼다.

따라서 첫 번째 구조를 실패로 폐기한 것이 아니라, 실행 환경 분리로 해결하지 못한 역할·의존 방향·테스트 경계 문제를 해결하기 위해 두 번째 축으로 전환했다.

```text
초기 혼합 구조
→ server/client/shared: 실행 환경 중심
→ core/adapters/services/actions/ui: 역할 중심
```

## 결정

디렉터리는 코드가 어디서 실행되는지가 아니라 무슨 역할을 담당하는지를 표현한다.

| 디렉터리 | 배치 기준 |
|---|---|
| `app/` | Next.js가 위치를 강제하는 라우팅 진입점과 route-local UI |
| `actions/` | 입력 검증, Service 위임, 응답 변환과 캐시 갱신 |
| `services/` | 비즈니스 규칙, DB 작업과 외부 연동의 유스케이스 조합 |
| `models/` | Mongoose schema와 persistence 표현 |
| `db/` | DB 연결 인프라 |
| `adapters/` | 외부 SDK, 브라우저 API와 프레임워크 API 경계 |
| `core/` | I/O 없는 도메인 타입·스키마·정적 콘텐츠·순수 계산 |
| `ui/` | 재사용 UI, Hook과 클라이언트 상태 |

역할 이외의 경계는 전용 장치가 담당한다.

```text
디렉터리             = 역할
server-only/client-only = 런타임 경계
ESLint                = 계층 의존 방향
Vitest project        = 테스트 실행 환경
```

Actions는 Client Component가 `"use server"` export를 RPC 참조로 import하므로 `server-only` 적용 대상에서 제외한다. 대신 Action 파일에는 Action만 두고 models, db, adapters를 직접 호출하지 않으며 업무 흐름은 services에 위임한다.

서버 구현과 브라우저 구현이 한 Adapter 폴더에 공존할 수는 있지만 서로 다른 런타임 파일을 한 배럴에서 재수출하지 않는다. 특히 Cloudinary는 서버와 브라우저 구현을 함께 내보내는 배럴을 두지 않는다.

## 검토한 대안

### `server/client/shared` 유지

실행 위치가 경로에 드러나는 장점이 있다. 그러나 각 런타임 폴더 안에서 역할을 다시 나눠야 하며, 코드가 통과하는 경계와 테스트 준비물을 예측할 수 없어 최종 구조로 유지하지 않았다.

### 기능별 수직 슬라이스

도메인 응집도가 높지만 현재 규모에서는 공용 UI, 외부 Adapter, Mongoose 계층과 Next.js `app/` 규칙을 도메인별로 중복하거나 복잡하게 만든다. 기능 경계가 계층 경계보다 더 큰 가치가 생기면 별도 ADR로 재검토한다.

### Repository 계층 추가

Mongoose Model이 persistence 접근을 이미 제공하며, 추가 추상화는 당시 문제였던 런타임·역할·테스트 경계 혼재를 해결하지 않는다. 실제 교체 가능성이나 반복되는 쿼리 경계가 생기기 전에는 도입하지 않는다.

### 런타임과 역할을 중첩 디렉터리로 모두 표현

`server/services`, `client/adapters` 같은 중첩은 두 축을 경로에 보존하지만 이동과 import 깊이를 늘리고 공유 역할의 위치를 다시 모호하게 만든다. 런타임 경계는 컴파일러 표식이 더 강하게 검증하므로 디렉터리에 중복하지 않는다.

## 결과

코드 위치로 책임과 허용되는 의존 방향을 예측할 수 있고, UI의 DB 계층 의존과 core의 상위 계층 의존을 ESLint로 차단한다. 테스트는 폴더 이름 자체가 아니라 실제로 통과하는 경계를 기준으로 unit, component, integration과 E2E로 실행한다.

대신 서버와 브라우저 구분이 경로에 직접 드러나지 않으므로 Adapter 구현에 `server-only` 또는 `client-only` 표식이 필요하다. 서로 다른 런타임을 함께 재수출하는 배럴은 만들 수 없고, Actions는 비즈니스 로직을 소유하지 않아야 한다. 실제 MongoDB를 공유하는 integration은 데이터 격리를 위해 파일을 직렬 실행한다.

현재 운영 규칙의 단일 원본은 각 계층의 `AGENTS.md`와 `docs/architecture/`, `docs/conventions/`, `docs/validation/`이다. 이 ADR은 그 규칙을 복제하지 않고 선택의 이유를 보존한다.

## 관련 이력

- 1차 런타임 중심 이동: `2499913`
- 역할 중심 구조 제안: [PR #25](https://github.com/rhsiddlsidhd/tie-knot/pull/25)
- Server Action의 `server-only` 제외 보정: [PR #26](https://github.com/rhsiddlsidhd/tie-knot/pull/26)
- 서버 런타임 경계 도입: [PR #27](https://github.com/rhsiddlsidhd/tie-knot/pull/27)
- 계층 의존 방향 강제: [PR #28](https://github.com/rhsiddlsidhd/tie-knot/pull/28)
- 역할 계층 이관과 검증: [PR #32](https://github.com/rhsiddlsidhd/tie-knot/pull/32)–[PR #38](https://github.com/rhsiddlsidhd/tie-knot/pull/38)
- Actions 책임 정리: [PR #39](https://github.com/rhsiddlsidhd/tie-knot/pull/39)
- 테스트 실행 경계 재설계: [PR #40](https://github.com/rhsiddlsidhd/tie-knot/pull/40)
