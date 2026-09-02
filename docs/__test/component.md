# Component Test

## Purpose

Component Test는 React runtime에서 Component와 Hook이 **사용자가 관찰할 수 있는 UI
behavior와 interaction을 올바르게 수행하는지** 검증한다. 구현 내부가 아니라 렌더링된
DOM, React lifecycle과 사용자가 시작한 행동의 공개 효과를 관찰한다.

파일명, 위치, 실행 명령, Arrange → Act → Assert와 공통 격리 원칙은
[`README.md`](README.md)를 따른다.

## Scope

Component Test는 Vitest의 jsdom 환경에서 실제 React runtime과 Testing Library를 사용한다.
대상은 하나의 UI 진입점이며, 필요한 경우 여러 실제 하위 Component, Provider, Hook과 Store가
함께 참여할 수 있다. Component 개수가 아니라 실행 환경과 관찰 경계로 분류한다.

주요 대상은 다음과 같다.

- React Component의 rendering과 conditional UI
- 사용자 입력, 선택, 제출, keyboard와 upload interaction
- loading, success, error와 empty state
- form 제출, validation과 접근성 계약
- React state, effect, rerender와 context에 의존하는 Hook
- 실제 Hook → SWR → fetch → MSW client data flow
- 여러 Component·Provider·Hook·Store가 참여하는 UI feature slice
- Router, Server Action, clipboard와 browser adapter로 전달되는 공개 효과

모든 Component Test는 다음 조건을 충족해야 한다.

1. 실제 React runtime에서 Component를 `render`하거나 Hook을 `renderHook`으로 실행한다.
2. 렌더링된 UI, React lifecycle 또는 사용자가 시작한 공식 경계 효과를 관찰한다.
3. server·DB·외부 browser 경계는 fixture, MSW 또는 공식 API Mock으로 통제한다.
4. 실제 browser layout, app server, URL navigation과 Production 외부 서비스를 실행하지 않는다.

파일명이나 `use*`라는 이름은 분류 근거가 아니다. state, effect, rerender, context와 SWR
cache처럼 React lifecycle이 필요하면 Component다. React 없이 직접 호출할 수 있는 순수
함수·reducer·Zustand store·mapper·validation은 Unit Test로 분리한다.

Server Component와 Page는 server dependency를 fixture 또는 공식 경계 Mock으로 대체하고,
반환 React tree를 Testing Library로 렌더링해 사용자가 보는 결과를 확인할 때 Component다.
렌더링하지 않고 실제 MongoDB 결과가 반환 tree의 props에 전달되는지만 확인하면
[Integration Test](integration.md)다. 렌더링도 실제 DB도 없이 Service 호출과 props 전달만
확인하면 Unit 또는 server wiring 검증으로 분리한다.

실제 browser, app server와 DB까지 통과하는 핵심 사용자 목표는 E2E로 분리한다. 실제 DB 없이
browser 호환성·layout·배포 asset만 확인하면 별도로 정의한 browser contract 또는 smoke가
담당한다.

## Environment

Component Test는 React, Vitest, jsdom, Testing Library, `user-event`와
`@testing-library/jest-dom`을 사용한다. 공용 setup은 각 테스트 후 DOM을 cleanup하고 jsdom에
없는 Pointer Events, Observer, `matchMedia`, `DataTransfer` 등의 최소 browser API를 보완한다.

polyfill과 Mock은 UI 로직의 입력을 제어하기 위한 수단이며 실제 browser 호환성을 증명하지
않는다. Component Test는 Production secret, 실제 외부 API, Service, Mongoose와 MongoDB에
의존하지 않아야 한다.

## Rendering Boundary

검증 대상 Component와 assertion이 관찰하는 하위 UI는 실제로 렌더링한다. loading, error,
empty state처럼 입력 상태를 만들기 위해 custom Hook의 공식 반환 경계를 대체할 수 있지만,
사용자가 보는 UI까지 stub으로 바꾸어서는 안 된다.

하위 Component를 stub으로 대체한 뒤 Hook 호출 인자나 props 전달만 확인하는 테스트는
Component가 아니라 Unit 또는 wiring 검증이다. Hook → SWR → fetch 결합 자체가 대상이면
Hook과 SWR을 Mock하지 않고 실제 구현과 MSW를 사용한다.

하나의 UI 진입점 아래 여러 실제 Component, Provider, Hook과 Store를 함께 렌더링해도
Component Scope를 유지한다. 각 Test File은 React runtime으로 관찰하는 하나의 Component
또는 Hook behavior만 담당하며, 순수 로직 직접 호출을 함께 두지 않는다.

## User-Observable Results

사용자가 직접 보는 content와 state를 우선 검증한다. 다음 query 순서를 기본으로 사용한다.

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

`data-testid`는 의미 있는 role, label과 text가 없을 때만 사용한다. 사용자에게 직접 보이지
않더라도 browser 제출·접근성·focus 계약에 속하는 hidden field, `FormData`, `aria-*`,
disabled·checked·selected 상태는 공개 Component behavior다.

특정 wrapper 계층, class 이름, 내부 element 순서와 대규모 snapshot은 behavior에 필수적이지
않으면 검증하지 않는다. React 내부 state, private function과 Component 내부 함수 호출
횟수도 직접 확인하지 않는다.

## User Interaction

click, type, select, upload와 keyboard 같은 사용자 행동은 테스트마다 생성한 `userEvent`
instance로 수행한다. `fireEvent`는 `userEvent`가 표현하지 못하는 low-level browser event가
검증 대상일 때만 사용한다.

`act`는 Observer callback, timer 진행과 외부 Store 갱신처럼 React 밖에서 발생한 상태 변화를
전달할 때만 사용한다. Component의 event handler나 Mock에서 추출한 callback을 테스트가
직접 호출해 UI 경로를 우회하지 않는다.

DOM 변화가 없더라도 렌더링된 UI에서 사용자가 시작한 행동이 `action`, `router.push`,
clipboard 또는 browser adapter 호출로 이어진다면 공식 경계의 인자와 시점을 확인할 수 있다.
렌더링 없이 호출하거나 내부 callback을 직접 실행한 결과는 Component behavior가 아니다.

## Client Data Flow

client fetch 흐름이 대상이면 실제 Hook, SWR와 fetch를 유지하고 MSW가 HTTP 응답만 대체한다.
실제 Route Handler, Service, Mongoose와 MongoDB는 실행하지 않는다. 각 테스트는 새로운 SWR
provider와 cache를 사용하며 처리되지 않은 MSW 요청은 즉시 실패시킨다.

일반적으로 요청 key·payload와 loading → success·error·empty의 사용자 상태를 확인한다.
정확한 호출 횟수는 deduplication이나 revalidation 자체가 계약일 때만 검증한다. SWR 내부
재검증 횟수에는 결합하지 않는다.

optimistic UI가 있으면 실패 시 rollback을 확인한다. unmount, 검색어 변경과 중복 제출처럼
이전 비동기 결과가 늦게 도착할 수 있는 흐름은 stale UI와 중복 side effect가 남지 않는지
검증한다.

## External Boundaries and Mocking

Server Action은 전달받은 action 함수 또는 공식 import 경계에서 대체하고 성공·실패 결과에
따른 UI를 검증한다. Next Router, redirect, clipboard와 browser SDK처럼 jsdom에서 결과를
직접 관찰할 수 없는 경계는 공식 API를 대체해 호출 인자와 시점을 확인할 수 있다.

Cloudinary, PortOne, Kakao와 외부 HTTP API는 실제 호출하지 않는다. HTTP client flow에는
MSW를 사용하고 browser SDK에는 adapter 경계 Mock을 사용한다. 단순히 테스트를 쉽게 만들기
위해 검증 대상 Component·Hook의 behavior를 Mock하지 않는다.

Mock은 가능한 한 전체 모듈을 지우지 않고 실제 export를 유지한 채 필요한 공식 경계만
대체한다. 테스트가 제외한 경계가 결과 이해에 중요하면 주석으로 대상과 이유를 명시한다.

## Async Behavior and Time

비동기 DOM은 `findBy*`, 공식 경계 side effect는 `waitFor`로 기다린다. 임의의 sleep과 고정
지연시간에 의존하지 않는다. loading 상태는 제어 가능한 Promise나 필요한 최소 MSW delay로
만들고 네트워크 속도 우연에 맡기지 않는다.

실제 timer를 기본으로 사용한다. debounce와 timeout처럼 시간 자체가 검증 대상일 때만 fake
timer를 사용하고 종료 전에 복구한다. fake timer와 `userEvent`를 함께 사용하면
`userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`처럼 timer 진행을 연결한다.

## Browser Limitations

jsdom에서는 DOM 의미, 접근 가능한 role·name, 입력·선택·focus 전이, 조건부 rendering과
제어된 Observer callback을 검증한다.

다음 behavior는 jsdom 결과를 실제 browser 증거로 사용하지 않는다.

- 실제 layout, CSS와 반응형 배치
- animation, scroll geometry와 portal 위치
- 실제 browser navigation과 download
- 결제 popup과 외부 SDK 호환성
- hydration과 browser별 runtime 차이

이 영역은 E2E 또는 별도로 정의한 opt-in browser smoke test가 담당한다.

## Test Data

Component fixture는 client가 실제로 받는 DTO, props와 HTTP response 형태의 순수 객체다.
Model, Mongoose, Service와 DB를 import하지 않는다. Integration이 만든 결과나 DB 상태를
이어받지 않고 같은 시나리오를 독립 fixture 또는 factory로 다시 표현한다.

ID·날짜·상태는 결정적인 값으로 만들고 테스트가 변경할 수 있는 객체는 매번 새로 생성한다.
기본 fixture는 유효한 최소 데이터를 제공하며 각 테스트는 behavior에 필요한 값만 override한다.

## Isolation and Cleanup

각 테스트는 새로운 render를 사용하고, 사용자 interaction을 수행할 때마다 새로운
`userEvent` instance를 생성한다. SWR은 테스트별 provider로 독립 cache를 제공하고, MSW
handler는 각 테스트 후 reset한다. fixture 객체는 공유할 수 있지만 변경 가능한 runtime
상태는 공유하지 않는다.

테스트가 변경한 Zustand Store, `localStorage`, `sessionStorage`, Mock, fake timer, portal DOM,
`fetch`, Observer와 browser global은 종료 전에 초기 상태로 복구한다. DOM cleanup만으로
client cache와 전역 Store가 초기화된다고 가정하지 않는다.

예상하지 않은 React warning, `console.error`, unhandled Promise rejection과 MSW 미처리
요청은 테스트 실패로 취급한다. Error Boundary처럼 오류 자체가 시나리오인 테스트만 출력을
명시적으로 대체하고 내용까지 확인한 뒤 복구한다. warning을 숨기는 전역 Mock은 허용하지
않는다.

## What to Test

- props와 fixture에 따른 rendering과 conditional UI
- 사용자 interaction에 따른 UI와 접근성 상태 전이
- form 입력·validation·제출과 공개 browser 계약
- loading, success, error와 empty state
- Hook의 state, effect, rerender, context와 cache behavior
- 실제 Hook → SWR → fetch → MSW client data flow
- Router, Action과 browser adapter로 전달되는 사용자 시작 효과
- optimistic update, rollback과 stale response 경쟁 상태
- 여러 실제 UI 모듈이 참여하는 feature slice

## What Not to Test

Component Test에서는 다음을 직접 또는 함께 검증하지 않는다.

- React 없이 호출할 수 있는 순수 함수·reducer·Store·mapper
- React 내부 state, private function과 내부 호출 횟수
- stub UI의 props 전달만 확인하는 wiring
- 직접 handler·내부 callback 호출로 우회한 결과
- 특정 DOM wrapper, class 이름과 대규모 snapshot
- 실제 Route Handler, Service, Mongoose와 MongoDB
- 실제 Production API와 browser SDK
- 실제 layout, CSS, navigation, hydration과 browser 호환성

## Examples

다음 예제는 실제 UI에서 사용자 행동을 시작하고 action prop이라는 공식 경계 효과를 확인한다.

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("유효한 자격증명을 제출한다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm action={action} pending={false} />);

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
```

다음 예제는 실제 Hook, SWR와 fetch를 유지하고 MSW가 HTTP 경계만 대체한다. 테스트마다
새 cache를 사용하며 상대 URL을 테스트 origin으로 변환한 `fetch`도 종료 시 복구한다.

```tsx
import type { PropsWithChildren } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { SWRConfig } from "swr";
import { useAuth } from "./useAuth";

const session = {
  role: "ADMIN" as const,
  email: "admin@example.com",
  userId: "user-1",
};

const server = setupServer(
  http.get("http://localhost/api/auth/me", () =>
    HttpResponse.json({ success: true, data: session }),
  ),
);
const nativeFetch = globalThis.fetch;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const resolved =
      typeof input === "string" && input.startsWith("/")
        ? new URL(input, "http://localhost")
        : input;
    return interceptedFetch(resolved, init);
  }) as typeof fetch;
});

afterEach(() => server.resetHandlers());

afterAll(() => {
  server.close();
  globalThis.fetch = nativeFetch;
});

const wrapper = ({ children }: PropsWithChildren) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("useAuth", () => {
  it("HTTP 응답의 session을 노출한다", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.session).toEqual(session));
    expect(result.current.isLoading).toBe(false);
  });

  it("session이 없으면 null을 노출한다", async () => {
    server.use(
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({ success: true, data: null }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
  });
});
```
