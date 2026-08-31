# Unit Test

## Purpose

Unit Test는 하나의 함수 또는 독립적인 모듈의 **behavior를 빠르고 격리된 환경에서 검증**한다.

주요 목적은 비즈니스 로직과 규칙이 다양한 입력 조건에서 올바르게 동작하는지 확인하는 것이다.

## Scope

Unit Test는 다음을 대상으로 한다.

* 순수 함수
* Business Logic
* Domain Logic
* 데이터 변환
* Validation Logic
* 조건 분기
* 계산 및 정책
* 독립적인 Service Logic

Unit Test에서는 실제 외부 시스템과의 결합을 검증하지 않는다.

## What to Test

### Input → Output

동일한 입력에 대해 올바른 결과를 반환하는지 검증한다.

```ts
it("100점 이상이면 합격을 반환한다", () => {
  expect(evaluateScore(100)).toBe("PASS");
});
```

### Business Rules

```ts
it("관리자 사용자는 모든 문서를 조회할 수 있다", () => {
  expect(canReadDocument(admin, document)).toBe(true);
});
```

### Boundary Conditions

* 최소값
* 최대값
* 빈 값
* null / undefined
* 경계값
* 잘못된 입력

## What Not to Test

Unit Test에서는 다음을 직접 검증하지 않는다.

* MongoDB 동작
* Mongoose 동작
* HTTP 통신
* 실제 외부 API
* React rendering
* Browser behavior
* 구현 세부사항

예를 들어 내부에서 `map()`을 사용했는지보다 최종 behavior를 검증한다.

## Dependencies and Mocking

외부 dependency는 Unit Test의 격리를 위해 Mock할 수 있다.

```text
Unit Under Test
      │
      ├── Mock Repository
      ├── Mock API Client
      └── Mock External Service
```

단, 테스트 대상 자체를 Mock해서는 안 된다.

### Mocking Rule

> **Mock은 dependency를 격리하기 위해 사용하며, behavior 자체를 만들어내기 위해 사용하지 않는다.**

Mock 호출 횟수나 내부 구현보다 실제 결과를 우선 검증한다.

## Test Structure

기본 구조는 Arrange → Act → Assert를 따른다.

```ts
it("유효한 사용자를 생성한다", async () => {
  // Arrange
  const input = createUserInput();

  // Act
  const result = await createUser(input);

  // Assert
  expect(result.email).toBe(input.email);
});
```

## Naming

파일명:

```text
<target>.unit.test.ts
```

Examples:

```text
user.service.unit.test.ts
calculate-price.unit.test.ts
validate-email.unit.test.ts
```

테스트 이름은 behavior를 설명한다.

```ts
it("중복된 이메일이면 사용자 생성을 거부한다");
```

## Test Data

테스트 목적이 명확하다면 필요한 데이터를 테스트 내부에서 직접 정의한다.

반복적으로 사용되는 복잡한 데이터는 factory를 사용할 수 있다.

```ts
const user = createUserFixture({
  role: "admin",
});
```

테스트 간 mutable data를 공유하지 않는다.

## Isolation

각 테스트는 독립적으로 실행되어야 한다.

* 테스트 간 상태 공유 금지
* 전역 mutable state 최소화
* Mock 상태 초기화
* 실행 순서 의존 금지

## Examples

### Good

```ts
it("빈 장바구니에서는 결제할 수 없다", () => {
  expect(() => checkout([])).toThrow();
});
```

### Bad

```ts
it("checkout 내부에서 validateCart가 호출된다", () => {
  expect(validateCart).toHaveBeenCalled();
});
```

첫 번째 테스트는 behavior를 검증하고, 두 번째 테스트는 구현 방식을 검증한다.
