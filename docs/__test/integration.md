# Integration Test

## Purpose

Integration Test는 여러 실제 모듈이 결합되었을 때 **각 모듈이 서로 올바르게 상호작용하는지** 검증한다.

이 프로젝트에서는 특히 **Mongoose와 MongoDB 데이터 계층의 실제 동작**을 검증하는 데 사용한다.

## Scope

주요 대상:

* Service + Repository
* Repository + Mongoose
* Mongoose Model + MongoDB
* API Route + Service + Repository
* 여러 모듈의 실제 결합

## Database

Integration Test에서는 실제 MongoDB behavior를 검증하기 위해 `mongodb-memory-server`를 사용한다.

```text
Integration Test
       ↓
Service
       ↓
Repository
       ↓
Mongoose
       ↓
mongodb-memory-server
       ↓
MongoDB
```

Mongoose Model 자체를 Mock하지 않는다.

## Why mongodb-memory-server

Integration Test는 실제 MongoDB와 유사한 동작을 필요로 하지만 개발자 또는 CI 환경의 외부 MongoDB에 의존해서는 안 된다.

따라서 테스트 실행 시 독립적인 MongoDB 인스턴스를 생성한다.

## What to Test

* Document 생성
* 조회
* 수정
* 삭제
* Query 조건
* Index / Constraint behavior
* Mongoose Schema behavior
* Service와 Repository의 결합
* 실제 DB 상태에 따른 business behavior

## What Not to Test

Integration Test에서는 다음을 반복해서 검증하지 않는다.

* 순수 함수의 모든 분기
* React UI
* Browser interaction
* 실제 Production MongoDB
* 외부 API의 실제 동작

## Test Data

테스트마다 필요한 데이터를 명시적으로 생성한다.

```text
Arrange
  ↓
Create Test Data
  ↓
Act
  ↓
Assert
  ↓
Cleanup
```

테스트 간 DB 상태를 공유하지 않는다.

## Isolation

각 테스트는 다른 테스트의 DB 상태에 의존하지 않아야 한다.

필요한 경우:

* Collection cleanup
* Database reset
* Fixture recreation

등을 사용한다.

## Mocking

Integration Test에서는 **검증 대상인 실제 내부 dependency를 Mock하지 않는다.**

예:

```text
Service
  ↓
Repository       ← Mock ❌
  ↓
Mongoose         ← 실제 사용
  ↓
Memory MongoDB   ← 실제 사용
```

외부 시스템이 테스트 범위를 벗어나는 경우에는 해당 외부 시스템만 Mock할 수 있다.

## API Integration

Next.js Route Handler의 API behavior와 데이터 계층의 결합을 검증할 수 있다.

```text
Request
   ↓
Route Handler
   ↓
Service
   ↓
Repository
   ↓
Mongoose
   ↓
MongoDB
```

이 테스트에서는 HTTP endpoint의 behavior와 실제 DB 상태를 함께 검증한다.

## Naming

파일명:

```text
<target>.integration.test.ts
```

Examples:

```text
user.repository.integration.test.ts
user.service.integration.test.ts
user.api.integration.test.ts
```

## Examples

```ts
it("사용자를 생성한 후 MongoDB에서 조회할 수 있다", async () => {
  const created = await userService.create(input);

  const found = await userRepository.findById(created.id);

  expect(found?.email).toBe(input.email);
});
```

Integration Test의 핵심은 **실제 모듈 간 결합이 올바르게 동작하는지 검증하는 것**이다.
