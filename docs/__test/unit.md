# Unit Test

## Purpose

Unit Test는 하나의 공개 behavior를 소유한 제품 모듈을 직접 실행하고, 모듈 바깥의
collaborator를 통제해 **입력 변환, 규칙, 위임, 오류와 반환 계약을 빠르게 검증**한다.
Unit은 반드시 순수 함수일 필요가 없다.

파일명, 위치, 실행 명령, Arrange → Act → Assert와 공통 격리 원칙은
[`README.md`](README.md)를 따른다.

## Scope

Unit의 경계는 실행한 파일이나 함수 개수가 아니라 하나의 공개 behavior를 소유한 제품
모듈을 기준으로 정한다. 대상 모듈과 내부 구현 세부사항인 helper·value object는 함께 실제로
실행할 수 있다. 독립 책임과 공개 계약을 가진 collaborator만 공식 경계에서 대체한다.

주요 대상은 다음과 같다.

- 순수 함수, 계산, mapper와 domain policy
- Zod schema와 Mongoose에서 분리된 순수 validator
- React 없이 직접 호출하는 reducer와 Zustand Store
- Service를 대체하고 직접 호출하는 Server Action과 Route Handler
- Service를 대체하고 렌더링 없이 직접 호출하는 Server Component와 Page
- `fetch` 또는 vendor SDK를 대체하고 직접 호출하는 server·browser adapter
- 입력 정규화, collaborator 위임, 오류 매핑과 반환 계약을 소유한 orchestration 모듈

모든 Unit Test는 다음 조건을 충족해야 한다.

1. 검증 대상으로 선택한 제품 모듈과 내부 helper를 실제로 실행한다.
2. 실제 MongoDB, 실제 HTTP network와 React rendering을 사용하지 않는다.
3. 대상 바깥의 collaborator만 공식 import·함수·SDK 경계에서 대체한다.
4. 하나의 공개 behavior와 그 결과 또는 공개 side effect를 검증한다.

React element를 반환한다는 사실만으로 Component Test가 되지는 않는다. Testing Library로
렌더링하지 않고 Page 함수를 직접 호출해 입력 정규화, Service 위임과 반환 element의 직접
child type·props만 확인하면 server wiring Unit이다. 실제 MongoDB 결과가 props에 전달되는지
확인하면 [Integration Test](integration.md), fixture로 반환 UI를 렌더링해 사용자 결과를
확인하면 [Component Test](component.md)다. Unit에서는 깊은 React tree나 DOM 결과를
검증하지 않는다.

## Environment

Unit의 기본 실행 환경은 Vitest의 Node 환경이다. `window`, `sessionStorage`와 `File` 같은
소수의 Web API가 필요한 browser adapter는 테스트에서 최소 global stub을 제공하고 종료 전에
복구한다. 실제 DOM 또는 storage event처럼 jsdom의 동작 자체가 필요할 때만 파일 단위로 jsdom
환경을 사용한다.

파일 단위 jsdom이 필요하면 테스트 파일 첫 줄에 다음 directive를 둔다.

```ts
// @vitest-environment jsdom
```

jsdom을 사용하더라도 React를 render하지 않고 lifecycle을 관찰하지 않으면 Unit이다. 반대로
환경 이름이 Node여도 실제 network나 MongoDB를 사용하면 Unit으로 인정하지 않는다.

## Unit Boundary and Mocking

대상 모듈의 반환값이나 business behavior를 Mock하지 않는다. 같은 Unit에 속한 private helper도
Mock하지 않는다. 내부 helper를 대체해야만 테스트할 수 있다면 독립 제품 모듈로 추출해 공개
collaborator 경계를 만든다.

다음과 같이 Unit 바깥의 공식 경계는 대체할 수 있다.

```text
Unit Under Test
      │
      ├── Mock Service
      ├── Mock fetch / Vendor SDK
      ├── Mock Router / cache invalidation
      └── Injected clock / environment
```

모듈 전체를 무조건 비우지 않고 가능한 한 실제 export를 유지하면서 필요한 공식 경계만
대체한다. Mock이 정상 결과를 대신 만들어 테스트 대상의 logic을 우회해서는 안 된다.

여러 내부 모듈이 함께 실제로 실행되어도 하나의 공개 behavior에 속하면 Unit 범위를 유지한다.
반면 여러 독립 제품 모듈의 계약을 한 파일에서 동시에 증명하거나 실패 원인을 특정하기
어려우면 대상별로 분리한다.

## Pure Rules and Mongoose Boundary

Zod schema, 계산과 Mongoose에서 분리된 validator는 입력과 출력으로 직접 검증한다. 대표값과
경계값을 사용하고 누락 위험이 큰 규칙의 반복 입력은 `it.each`로 명시할 수 있다.

Mongoose Model·Schema의 casting, default, middleware, discriminator와 validation 적용은 DB
없는 Unit으로 검증하지 않는다. 순수 규칙은 함수로 추출해 Unit에서 검증하고, Mongoose에
실제로 적용되는지는 실제 Mongoose → MongoDB 경계를 사용하는 Integration에서 확인한다.

## Orchestration Contracts

Action, Route Handler, Page와 adapter 같은 orchestration 모듈은 다음 공개 계약을 검증한다.

- 외부 입력의 parsing·normalization·validation
- 올바른 collaborator에 전달되는 입력 형태
- validation 실패 시 collaborator가 호출되지 않는 short-circuit
- dependency 결과의 반환 DTO·HTTP response 변환
- 알려진 오류의 매핑과 예상하지 못한 오류의 전파
- 한 번만 실행되어야 하는 side effect와 의미 있는 호출 순서

호출 인자·순서·횟수가 공개 계약이면 결과·오류 계약과 함께 검증할 수 있다. 단순히 구현에
Mock이 있다는 이유로 `toHaveBeenCalledTimes(1)`을 추가하지 않으며 순수 함수나 내부 helper의
호출 방식은 확인하지 않는다.

공개 계약을 바꾸는 의미 있는 분기만 검증한다. 구현의 모든 `if`를 그대로 복제하거나 coverage
수치를 채우기 위한 사례를 만들지 않는다. 같은 계약을 반복하는 입력은 대표값과 경계값으로
줄인다.

## HTTP and Browser Adapters

Unit에서 `fetch`는 공식 collaborator 경계다. 실제 network 요청을 모두 차단하고 직접 Mock해
adapter가 만든 URL·method·header·body와 응답 parsing·오류 정규화를 검증한다. Hook → SWR →
fetch 흐름은 MSW를 사용하는 Component Test이며, 실제 외부 API 호환성은 별도의 opt-in
contract 또는 smoke test가 담당한다.

PortOne과 같은 React 독립 browser adapter는 adapter 함수를 실제로 실행하고 vendor SDK를
Mock한다. `sessionStorage`나 `window`가 필요하면 해당 파일에만 최소 환경을 제공한다. React를
사용하는 browser Widget과 결제 버튼의 adapter 연결은 Component, 실제 popup과 browser 동작은
E2E 또는 browser smoke가 담당한다.

## Assertions

순수 규칙은 입력에 대한 결과와 오류를 검증한다. orchestration은 결과·오류 계약을 우선하고,
공개 계약인 collaborator 인자, 미호출, 순서와 횟수를 함께 확인한다.

DTO, 오류 envelope와 HTTP 응답처럼 전체 shape 자체가 공개 계약이면 `toEqual`로 정확히
비교한다. assertion과 무관한 필드는 `objectContaining` 등으로 제외할 수 있지만 계약상 필수
필드가 빠져도 통과하게 만들지 않는다. 큰 객체와 React element tree를 snapshot으로 고정하지
않는다. 날짜와 ID는 결정적으로 만들거나 의미 있는 형식과 관계를 명시적으로 검증한다.

## Async Behavior and Runtime State

dependency의 성공과 실패는 명시적으로 resolve·reject하는 Promise로 제어하고 결과를 반드시
`await`한다. 임의의 sleep, 실제 network 지연과 polling 간격에 의존하지 않는다. 호출 순서나
중복 실행 방지가 계약이면 제어 가능한 deferred Promise로 실행 중 상태를 만든다.

실제 timer를 기본으로 사용한다. 시간 계산이 검증 대상일 때만 system time 또는 fake timer를
고정하고 종료 전에 복구한다. 시간, 난수, 환경변수, `fetch`와 browser global을 바꾸는 테스트는
`it.concurrent`로 실행하지 않는다.

환경변수와 import 시점 singleton·cache 자체가 대상일 때만 값을 먼저 stub한 뒤 동적으로
import한다. `resetModules()`는 해당 테스트의 최소 범위에서만 사용하며 공통 초기화로 두지
않는다. 가능하면 설정·clock·cache를 주입하거나 공식 reset 경계를 제공한다. import 순서에
우연히 의존해서는 안 된다.

테스트 종료 시 미해결 Promise, timer와 listener를 남기지 않는다. 예상하지 않은
`console.error`, warning, unhandled rejection과 실제 network 요청은 실패로 취급한다. 로깅이나
오류 보고가 공개 side effect인 경우만 해당 경계를 테스트 안에서 대체해 내용까지 확인하고
복구한다. 출력을 숨기는 전역 console Mock은 허용하지 않는다.

## Test Data

제품 모듈이 직접 받는 입력, DTO와 domain value 형태의 결정적인 plain object를 사용한다.
변경 가능한 객체는 테스트마다 새로 만들고 반복이 크면 DB와 React에 의존하지 않는 순수
builder·factory만 공유한다. 테스트 의도에 중요한 값은 factory 기본값에 숨기지 않고
Arrange에서 명시한다.

Mongoose document를 만드는 Integration factory와 UI 상태를 전제하는 Component fixture는
재사용하지 않는다. ID, 날짜와 seed는 실패를 재현할 수 있는 값으로 만든다.

## Isolation and Cleanup

각 테스트는 다른 테스트의 상태와 실행 순서를 가정하지 않는다. Mock, stubbed environment,
global, timer, module state와 mutable Store를 종료 전에 원상 복구한다. 같은 runtime 전역을
변경하는 테스트는 병렬 실행하지 않는다.

## What to Test

- 순수 함수, schema, mapper와 domain policy의 결과·경계값
- React 없이 직접 호출하는 reducer와 Zustand Store behavior
- Action·Route·Page의 입력 정규화, 위임, 반환과 오류 계약
- validation 실패의 short-circuit와 side effect 억제
- adapter의 요청 구성, 응답 parsing과 오류 정규화
- 공개 계약인 collaborator 인자·순서·횟수
- deterministic time·environment·module state behavior

## What Not to Test

Unit Test에서는 다음을 직접 또는 함께 검증하지 않는다.

- 실제 MongoDB와 Mongoose 적용 behavior
- 실제 HTTP network와 외부 API 호환성
- React rendering, lifecycle과 사용자 interaction
- 실제 browser navigation, popup과 layout
- 대상 모듈의 Mock 반환값으로 만든 business behavior
- private helper의 호출 방식과 구현의 모든 분기
- 깊은 React element tree와 대규모 snapshot
- 여러 독립 제품 모듈의 계약을 한 번에 묶은 흐름

## Examples

순수 함수는 경계값과 전체 반환 계약을 직접 확인한다.

```ts
import { describe, expect, it } from "vitest";
import { formatSignedPercent } from "./percent";

describe("formatSignedPercent", () => {
  it("previous가 0이면 null을 반환한다", () => {
    expect(formatSignedPercent(1000, 0)).toBeNull();
  });

  it("증가율의 label과 direction을 반환한다", () => {
    expect(formatSignedPercent(1125, 1000)).toEqual({
      label: "+12.5%",
      direction: "up",
    });
  });
});
```

Server Action은 실제 함수를 호출하고 Service라는 공식 collaborator만 대체한다. 입력 검증이
실패하면 Service를 호출하지 않고, 정상 경로에서는 변환한 입력과 반환 envelope를 확인한다.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({ getUserEmail: vi.fn() }));

import { getUserEmail } from "@/services";
import { findUserEmail } from "./findUserEmail";

const buildFormData = () => {
  const formData = new FormData();
  formData.set("name", "홍길동");
  formData.set("phone", "010-1234-5678");
  return formData;
};

describe("findUserEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("입력 검증에 실패하면 Service를 호출하지 않는다", async () => {
    const result = await findUserEmail(null, new FormData());

    expect(result).toMatchObject({
      success: false,
      error: { category: "VALIDATION" },
    });
    expect(getUserEmail).not.toHaveBeenCalled();
  });

  it("정규화한 입력을 Service에 전달하고 결과를 반환한다", async () => {
    vi.mocked(getUserEmail).mockResolvedValue("user@example.com");

    const result = await findUserEmail(null, buildFormData());

    expect(getUserEmail).toHaveBeenCalledWith({
      name: "홍길동",
      phone: "010-1234-5678",
    });
    expect(result).toEqual({
      success: true,
      data: { email: "user@example.com" },
    });
  });
});
```

HTTP adapter는 실제 network 대신 `fetch` 경계를 대체하고 parsing과 오류 정규화를 검증한다.

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSeoulOpenApi } from "./request";

afterEach(() => vi.unstubAllGlobals());

describe("fetchSeoulOpenApi", () => {
  it("API rows를 domain 입력으로 반환한다", async () => {
    const body = JSON.stringify({
      SearchSTNBySubwayLineInfo: {
        RESULT: { CODE: "INFO-000", MESSAGE: "정상 처리되었습니다" },
        row: [{ STATION_NM: "서울" }],
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 })),
    );

    await expect(
      fetchSeoulOpenApi("SearchSTNBySubwayLineInfo", [1, 1000]),
    ).resolves.toEqual([{ STATION_NM: "서울" }]);
  });

  it("network 오류를 외부 서비스 오류로 정규화한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));

    await expect(
      fetchSeoulOpenApi("SearchSTNBySubwayLineInfo", [1, 1000]),
    ).rejects.toMatchObject({ category: "EXTERNAL_SERVICE" });
  });
});
```
