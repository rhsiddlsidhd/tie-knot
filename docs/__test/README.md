# Test Conventions

이 디렉터리는 프로젝트의 테스트를 **어떻게 설계하고 작성하는지** 정의한다.

테스트 실행 여부나 CI 통과 기준은 CI configuration에서 관리하며, 이 문서는 테스트 코드의 설계 원칙과 작성 방법을 정의하는 것을 목적으로 한다.

## Key Files

| File             | Test Type   | Tool                           | Purpose                                          |
| ---------------- | ----------- | ------------------------------ | ------------------------------------------------ |
| `unit.md`        | Unit        | Vitest                         | 개별 함수와 모듈의 behavior 검증                           |
| `component.md`   | Component   | Vitest                         | React Component의 UI behavior와 사용자 interaction 검증 |
| `integration.md` | Integration | Vitest + mongodb-memory-server | 여러 모듈과 실제 데이터 계층의 결합 검증                          |
| `e2e.md`         | E2E         | Playwright                     | 실제 사용자 관점에서 애플리케이션 전체 흐름 검증                      |

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

* Unit → 개별 로직
* Component → UI behavior
* Integration → 모듈 간 결합
* E2E → 사용자 시나리오

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

### 9. Test File Naming

테스트 타입은 파일명에 명시한다.

```text
<target>.unit.test.ts
<target>.component.test.tsx
<target>.integration.test.ts
<target>.e2e.spec.ts
```

Examples:

```text
user.service.unit.test.ts
UserForm.component.test.tsx
user.repository.integration.test.ts
signup.e2e.spec.ts
```

### 10. Test Location

Unit과 Component Test는 구현 코드와 함께 **co-location**한다.

```text
UserForm.tsx
UserForm.component.test.tsx
```

Integration Test와 E2E Test는 별도의 테스트 영역에서 관리한다.

```text
tests/
├── integration/
└── e2e/
```

## Choosing a Test Type

새로운 테스트를 작성할 때는 가장 좁은 범위의 테스트 레이어를 우선 선택한다.

```text
순수한 함수/비즈니스 로직인가?
        ↓ Yes
       Unit

UI behavior인가?
        ↓ Yes
    Component

여러 실제 모듈의 결합을 검증하는가?
        ↓ Yes
   Integration

사용자의 전체 흐름을 검증하는가?
        ↓ Yes
      E2E
```

상위 레이어 테스트로 하위 레이어의 모든 behavior를 반복해서 검증하지 않는다.
