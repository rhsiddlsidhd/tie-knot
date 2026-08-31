# Component Test

## Purpose

Component Test는 React Component가 **사용자가 관찰할 수 있는 UI behavior와 interaction을 올바르게 수행하는지** 검증한다.

구현 내부가 아니라 렌더링된 UI와 사용자 행동을 중심으로 테스트한다.

## Scope

Component Test는 다음을 대상으로 한다.

* Component rendering
* User interaction
* UI state
* Form behavior
* Validation
* Conditional rendering
* Loading / Error / Empty state
* Accessibility behavior
* Component 간 필요한 UI interaction

## What to Test

### Rendering

필요한 콘텐츠가 화면에 표시되는지 검증한다.

```ts
expect(screen.getByRole("heading", { name: "사용자 정보" }))
  .toBeInTheDocument();
```

### User Interaction

실제 사용자의 행동을 기준으로 테스트한다.

```text
사용자
  ↓
click / type / select
  ↓
Component
  ↓
UI 변화
```

### State Changes

사용자 행동에 따라 UI가 올바르게 변경되는지 검증한다.

```ts
await user.click(screen.getByRole("button", { name: "저장" }));

expect(
  screen.getByText("저장되었습니다")
).toBeInTheDocument();
```

## What Not to Test

Component Test에서는 다음을 직접 검증하지 않는다.

* React 내부 state
* private function
* 특정 hook의 내부 구현
* 특정 DOM 구조에 대한 불필요한 의존
* CSS implementation
* component 내부 함수 호출 횟수

예:

```ts
// Avoid
expect(component.state.isOpen).toBe(true);
```

대신 사용자에게 보이는 결과를 검증한다.

```ts
expect(screen.getByRole("dialog")).toBeVisible();
```

## User-Centric Queries

가능하면 사용자가 UI를 인식하는 방식과 가까운 query를 우선한다.

권장 우선순위:

```text
getByRole
    ↓
getByLabelText
    ↓
getByPlaceholderText
    ↓
getByText
    ↓
getByTestId
```

`data-testid`는 다른 의미 있는 접근 방법이 없을 때 사용한다.

## User Interaction

사용자 interaction은 실제 사용자 행동에 가깝게 작성한다.

```ts
const user = userEvent.setup();

await user.type(
  screen.getByRole("textbox", { name: "이메일" }),
  "user@example.com"
);

await user.click(
  screen.getByRole("button", { name: "제출" })
);
```

## Mocking

Component Test에서는 Component의 외부 경계를 필요한 범위에서 Mock한다.

예:

```text
Component
   │
   ├── Mock API
   ├── Mock Router
   └── Mock External Service
```

단순히 테스트를 쉽게 만들기 위해 Component 내부 behavior를 Mock하지 않는다.

## Test Structure

기본적으로 Arrange → Act → Assert를 따른다.

```ts
it("유효한 이메일을 입력하면 제출 버튼을 활성화한다", async () => {
  // Arrange
  render(<SignupForm />);

  // Act
  await user.type(
    screen.getByRole("textbox", { name: "이메일" }),
    "user@example.com"
  );

  // Assert
  expect(
    screen.getByRole("button", { name: "가입하기" })
  ).toBeEnabled();
});
```

## Naming

파일명:

```text
<target>.component.test.tsx
```

Examples:

```text
UserForm.component.test.tsx
LoginForm.component.test.tsx
UserList.component.test.tsx
```

테스트 이름은 사용자에게 나타나는 behavior를 설명한다.

```ts
it("잘못된 이메일을 입력하면 오류 메시지를 표시한다");
```

## Test Data

Component의 rendering에 필요한 최소한의 데이터를 사용한다.

복잡한 객체는 factory를 사용할 수 있다.

```ts
const user = createUserFixture({
  name: "홍길동",
});
```

불필요한 필드를 과도하게 구성하지 않는다.

## Isolation and Cleanup

각 테스트는 독립적으로 실행되어야 한다.

* DOM 상태에 의존하지 않는다.
* Mock 상태를 초기화한다.
* Timer를 사용했다면 원래 상태로 복구한다.
* 테스트 간 Component state를 공유하지 않는다.

## Examples

### Good

```ts
it("삭제 버튼을 클릭하면 삭제 확인 메시지를 표시한다", async () => {
  render(<UserList users={users} />);

  await user.click(
    screen.getByRole("button", { name: "삭제" })
  );

  expect(
    screen.getByRole("dialog", { name: "삭제 확인" })
  ).toBeVisible();
});
```

### Bad

```ts
it("isOpen state가 true가 된다", () => {
  // 내부 state 직접 검증
});
```

Component Test의 목적은 Component의 내부 구현이 아니라 **사용자가 경험하는 결과를 검증하는 것**이다.
