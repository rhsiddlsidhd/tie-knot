# Test Conventions

이 디렉터리는 프로젝트의 테스트를 **어떻게 설계하고 작성하는지** 정의한다.

테스트 실행 여부나 CI 통과 기준은 CI configuration에서 관리하며, 이 문서는 테스트 코드의 설계 원칙과 작성 방법을 정의하는 것을 목적으로 한다.

## Key Files

| File             | Test Type   | Tool                           | Purpose                                                  |
| ---------------- | ----------- | ------------------------------ | -------------------------------------------------------- |
| `unit.md`        | Unit        | Vitest                         | 제품 모듈을 직접 실행하고 collaborator를 격리해 검증     |
| `component.md`   | Component   | Vitest + Testing Library       | React runtime의 UI·Hook behavior와 interaction 검증      |
| `integration.md` | Integration | Vitest + mongodb-memory-server | Next.js 서버 코드와 실제 MongoDB 데이터 계층의 결합 검증 |
| `e2e.md`         | E2E         | Playwright Test                | 실제 browser·server·DB를 통과하는 핵심 사용자 목표 검증  |

## Test Pyramid

테스트는 가능한 한 아래 계층의 책임에 따라 작성한다.

```text
             E2E
        ─────────────
         Integration
      ─────────────────
          Component
    ─────────────────────
             Unit
  ─────────────────────────
```

하위 레이어일수록 빠르고 좁은 범위를 검증하며, 상위 레이어일수록 실제 시스템에 가까운 환경에서 더 넓은 behavior를 검증한다.

## Common Conventions

### 1. Behavior over Implementation

구현 방법이 아니라 외부에서 관찰할 수 있는 behavior를 검증한다.

### 2. One Test, One Responsibility

하나의 테스트는 하나의 독립적인 behavior 또는 business rule을 검증한다.

### 3. Test Isolation

각 테스트는 다른 테스트의 실행 결과나 순서에 의존하지 않는다.

### 4. Deterministic Tests

동일한 조건에서 반복 실행해도 동일한 결과를 만들어야 한다.

시간, 랜덤 값, 외부 시스템 등 비결정적인 요소는 테스트 목적에 맞게 통제한다.

### 5. Explicit Test Boundaries

각 테스트 레이어는 자신의 책임을 넘어서 검증하지 않는다.

- Unit → 제품 모듈을 직접 실행하고 외부 collaborator를 격리한 behavior
- Component → React runtime에서 관찰하는 UI·Hook behavior
- Integration → 제품 서버·데이터 코드 ↔ 실제 Mongoose ↔ 격리된 MongoDB의 계약
- E2E → 실제 browser·app server·DB를 통과하는 핵심 사용자 목표

### 6. Arrange → Act → Assert

테스트는 기본적으로 다음 구조를 따른다.

```text
Arrange
  ↓
Act
  ↓
Assert
```

### 7. Readability over Cleverness

테스트 코드는 짧고 영리한 코드보다 의도가 명확한 코드를 우선한다.

### 8. Test Names Describe Behavior

테스트 이름은 구현이 아니라 검증하는 behavior를 설명한다.

```ts
it("유효한 이메일이면 사용자를 생성한다");
it("존재하지 않는 사용자를 조회하면 404를 반환한다");
```

### 9. Test File Naming, Location, and Command

파일명, 위치, 실행 명령은 이 문서에서 공통으로 관리한다.

| Test Type   | File Name                                                           | Location               | Command                    |
| ----------- | ------------------------------------------------------------------- | ---------------------- | -------------------------- |
| Unit        | `<target>.unit.test.ts`                                             | 대상 코드 옆 `src/`    | `npm run test:unit`        |
| Component   | `<target>.component.test.ts` 또는 `<target>.component.test.tsx`     | UI 대상 코드 옆 `src/` | `npm run test:component`   |
| Integration | `<target>.integration.test.ts` 또는 `<target>.integration.test.tsx` | `test/integration/`    | `npm run test:integration` |
| E2E         | `<scenario>.spec.ts`                                                | `test/e2e/`            | `npm run test:e2e`         |

위 표는 일반 4-Scope의 기본 명령을 정의한다. 실제 외부 서비스·Production build처럼 명시적으로
분리한 opt-in contract와 smoke는 해당 개별 문서가 파일, config와 별도 명령을 정의하며 기본
명령과 CI gate에 포함하지 않는다.

Examples:

```text
calculate-price.unit.test.ts
LoginForm.component.test.tsx
order.integration.test.ts
checkout.spec.ts
```

Vitest의 정확한 수집 범위와 실행 환경은 [`vitest.config.ts`](../../vitest.config.ts),
공개 명령은 [`package.json`](../../package.json)에서 이 규칙과 일치하도록 관리한다.
Node에서 직접 실행되는 프로젝트 도구는 대상 옆 `tooling/`에
`<target>.unit.test.mjs`로 두며 `npm run test:unit`에서 함께 실행한다.
공용 setup, DB helper, factory는 `test/support/`에 두며 테스트 파일은 두지 않는다.
하나의 테스트 파일에는 하나의 Test Type만 둔다. 같은 사용자 시나리오라도 Integration,
Component, E2E의 관찰 대상은 각각의 파일에서 독립적으로 준비하고 검증한다.

## Choosing a Test Type

새로운 테스트를 작성할 때는 가장 좁은 범위의 테스트 레이어를 우선 선택한다.

```text
React rendering, 실제 DB와 network 없이 하나의 제품 모듈을 직접 검증하는가?
        ↓ Yes
       Unit

React runtime과 jsdom이 필요한 UI·Hook behavior인가?
        ↓ Yes
    Component

제품 서버·데이터 코드가 실제 Mongoose와 격리된 MongoDB를 통과하며 경계의 계약을 검증하는가?
        ↓ Yes
   Integration

실제 browser·app server·DB를 통과해야 하는 핵심 사용자 목표인가?
        ↓ Yes
      E2E
```

MongoDB를 실제로 사용한다는 사실만으로는 Integration이 되지 않는다. React 렌더링과
사용자 관찰 결과는 Component, 실제 URL·네트워크·브라우저 흐름은 E2E로 분류한다.

상위 레이어 테스트로 하위 레이어의 모든 behavior를 반복해서 검증하지 않는다.
