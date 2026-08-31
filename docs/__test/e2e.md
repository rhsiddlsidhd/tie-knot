# E2E Test

## Purpose

E2E Test는 실제 사용자 관점에서 애플리케이션의 **완전한 사용자 시나리오가 정상적으로 동작하는지** 검증한다.

이 프로젝트에서는 Playwright를 사용한다.

## Scope

E2E Test는 다음을 검증한다.

* 주요 사용자 journey
* 페이지 이동
* Form submission
* Authentication flow
* 핵심 CRUD flow
* 주요 business workflow
* Browser와 Server의 실제 결합
* 사용자에게 중요한 Critical Path

## Application Boundary

E2E Test는 가능한 한 실제 애플리케이션에 가깝게 실행한다.

```text
Playwright
    ↓
Browser
    ↓
Next.js
    ↓
API / Server
    ↓
Service
    ↓
Mongoose
    ↓
Test Database
```

내부 함수를 직접 호출하지 않는다.

## What to Test

E2E에서는 **비즈니스적으로 중요한 사용자 시나리오**를 우선한다.

예:

```text
회원가입
→ 로그인
→ 사용자 페이지 접근
→ 데이터 생성
→ 데이터 확인
```

하나의 E2E 테스트는 완전한 사용자 behavior 또는 의미 있는 workflow를 표현한다.

## What Not to Test

E2E에서 다음을 과도하게 검증하지 않는다.

* 모든 validation rule
* 모든 business logic branch
* 모든 Component state
* 모든 API response case
* 내부 함수 호출
* DB query 구현

이러한 세부 behavior는 Unit / Component / Integration Test에서 검증한다.

## User-Centric Testing

E2E 테스트는 실제 사용자가 애플리케이션을 사용하는 것처럼 작성한다.

```ts
await page.getByLabel("이메일").fill("user@example.com");

await page.getByLabel("비밀번호").fill("password");

await page.getByRole("button", {
  name: "로그인",
}).click();
```

내부 selector나 implementation detail에 의존하지 않는다.

## Selectors

가능하면 의미 있는 사용자 중심 locator를 사용한다.

우선순위:

```text
getByRole
    ↓
getByLabel
    ↓
getByText
    ↓
getByPlaceholder
    ↓
data-testid
```

CSS selector나 DOM hierarchy에 대한 의존은 최소화한다.

## Test Data

E2E Test는 독립적인 test data를 사용한다.

테스트 간 계정이나 데이터 상태를 공유하지 않는다.

필요한 경우 테스트 시작 전에 fixture 또는 API를 통해 test data를 준비한다.

## Authentication

인증이 필요한 시나리오는 모든 테스트에서 불필요하게 로그인 과정을 반복하지 않는다.

공통 인증 상태를 사용할 수 있지만, 인증 자체가 테스트 대상인 경우에는 실제 로그인 flow를 검증한다.

```text
Authentication Test
→ 실제 login flow

Authenticated Feature Test
→ 재사용 가능한 authenticated state
```

## Stability

E2E Test는 실제 Browser 환경에서 실행되므로 timing과 asynchronous behavior에 주의한다.

다음 방식을 지양한다.

```ts
await page.waitForTimeout(1000);
```

대신 UI 상태나 네트워크 상태를 기다린다.

```ts
await expect(
  page.getByText("저장되었습니다")
).toBeVisible();
```

## Naming

파일명:

```text
<scenario>.e2e.spec.ts
```

Examples:

```text
signup.e2e.spec.ts
login.e2e.spec.ts
user-management.e2e.spec.ts
checkout.e2e.spec.ts
```

Test name은 사용자 시나리오를 설명한다.

```ts
test("사용자는 회원가입 후 로그인할 수 있다", async ({ page }) => {
  // ...
});
```

## Critical Path

모든 기능을 E2E로 테스트하지 않는다.

다음과 같은 **핵심 사용자 흐름**을 우선한다.

* 서비스 접근
* 인증
* 핵심 business workflow
* 데이터 생성/수정/삭제
* 결제 또는 중요한 transaction
* 주요 권한 흐름

## Examples

```ts
test("사용자는 새로운 사용자를 생성할 수 있다", async ({ page }) => {
  await page.goto("/users");

  await page.getByRole("button", {
    name: "사용자 추가",
  }).click();

  await page.getByLabel("이름").fill("홍길동");

  await page.getByRole("button", {
    name: "저장",
  }).click();

  await expect(
    page.getByText("홍길동")
  ).toBeVisible();
});
```

E2E Test의 목적은 내부 구현의 정확성을 증명하는 것이 아니라 **사용자에게 중요한 전체 시스템 behavior가 정상적으로 동작한다는 것을 검증하는 것**이다.
