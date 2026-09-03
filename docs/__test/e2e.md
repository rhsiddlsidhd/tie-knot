# E2E Test

## Purpose

E2E Test는 격리된 실제 browser에서 사용자가 애플리케이션의 URL을 열고 행동했을 때,
Next.js server와 실제 데이터 계층을 통과한 **핵심 사용자 목표가 끝까지 달성되는지** 검증한다.
이 프로젝트의 정식 E2E runner는 `@playwright/test`다.

파일명, 위치, 실행 명령, Arrange → Act → Assert와 공통 격리 원칙은
[`README.md`](README.md)를 따른다.

## Scope

일반 E2E는 Playwright Test가 격리된 Browser Context에서 실제 Next.js server의 URL을 열고,
사용자 행동을 통해 제품의 내부 server·data 경계를 실제로 통과한다.

```text
@playwright/test
       ↓
Desktop Chromium
       ↓
Next.js URL · routing · cookie
       ↓
Route Handler / Server Action / Server Component
       ↓
Service → Mongoose → E2E 전용 MongoDB
       ↓
사용자가 browser에서 다시 관찰하는 결과
```

모든 일반 E2E Test는 다음 조건을 충족해야 한다.

1. `@playwright/test`가 실제 browser와 격리된 Browser Context를 실행한다.
2. 테스트 전용 환경에서 실제 Next.js server의 URL·routing·network를 통과한다.
3. 검증 대상의 제품 경로가 실제 Service·Mongoose와 E2E 전용 MongoDB까지 이어진다.
4. 사용자가 시작한 행동과 browser에서 관찰하는 결과를 검증한다.
5. 앱 자체의 Route Handler·Server Action·Service와 business rule을 test double로 우회하지 않는다.

실제 browser만 실행한다는 사실만으로 일반 E2E가 되지는 않는다. 앱의 API를 `page.route`로
대체해 UI만 검증하면 Component 또는 별도로 정의한 browser contract 범위다. 실제 DB 결과를
React rendering 없이 확인하면 Integration이다. 외부 결제·메일·storage·지도는 제품의 공식
adapter 또는 별도 local fake server에서 대체할 수 있다.

E2E는 여러 화면을 무조건 길게 연결하는 테스트가 아니다. 하나의 테스트는 사용자가 달성하는
하나의 의미 있는 목표와 그 목표에 필요한 최소 단계만 수행한다.

## What Belongs in E2E

브라우저·routing·인증 cookie·server entry와 DB가 함께 동작해야 신뢰할 수 있고, 실패 비용이
큰 사용자 목표를 우선한다.

- 실제 로그인과 권한별 접근·redirect
- 관리자의 상품 등록·수정과 목록 재조회
- 실제 browser file upload와 저장 결과
- 주문 생성, 결제 redirect와 주문 내역 확인
- 실제 URL navigation, popup와 download가 계약인 흐름
- 데이터 손실, 권한 위반과 중복 결제처럼 치명적인 실패 경로
- mobile 또는 특정 browser에서만 위험한 핵심 journey

각 흐름의 대표 성공 경로와 치명적인 실패 경로만 E2E에 둔다. validation 조합, UI state,
Service 오류 분기와 DB constraint의 전체 경우는 Unit·Component·Integration에서 검증하고
E2E에서 반복하지 않는다.

## Directory Structure

E2E 파일은 사용자 목표 또는 feature journey에 따라 `test/e2e/` 아래에 둔다.

```text
test/e2e/
├── auth.spec.ts
├── products.spec.ts
├── checkout.spec.ts
├── portone-smoke.spec.ts  # 기본 E2E에서 제외한 manual browser smoke
└── ...                    # 독립된 다른 사용자 목표
```

위 파일명은 책임 영역의 예시이며 허용 목록이 아니다. 관련 시나리오는 하나의 feature
`*.spec.ts`에 묶을 수 있지만 각 테스트는 독립적으로 실행되어야 한다. 여러 테스트를
`serial`로 연결해 하나의 workflow를 완성하지 않는다.

## Test Runner and playwright-cli

정식 E2E는 `*.spec.ts`에 재현 가능한 단계와 assertion으로 저장되고 `@playwright/test`가 자동
PASS·FAIL을 판정한다. `playwright-cli`는 별도 테스트 계층이나 runner가 아니다.

`playwright-cli`는 다음 작업에만 보조적으로 사용한다.

- 실제 화면 탐색과 접근 가능한 locator 발견
- 실패한 Playwright Test에 `--debug=cli`로 연결
- snapshot, trace, console과 request 조사
- 재현 단계와 assertion 후보 확인

CLI 탐색에서 발견한 회귀는 독립된 데이터와 안정된 locator를 가진 `*.spec.ts`로 옮긴다. CLI로
수동 확인한 결과를 일반 E2E 통과로 기록하지 않는다. 사람이 카드사 인증을 완료하는 흐름은
[Manual Browser Smoke](#manual-browser-smoke)로 분류한다.

## Application Server

기본 E2E 명령은 전용 port에서 E2E MongoDB, 외부 local fake server와 Next.js server를 직접
시작하고 readiness를 확인한 뒤 테스트를 실행한다. 이미 실행 중인 개발 서버를 신뢰 가능한
기본 실행에서 재사용하지 않는다. server 재사용은 명시적인 로컬 디버깅 모드에서만 허용한다.

현재 일반 E2E는 `next dev`에서 실제 Chromium·Next.js·MongoDB 경로를 검증한다. 이 결과는
Production build, bundling, asset, hydration과 배포 설정까지 증명하지 않는다. 해당 계약은
`next build`·`next start`를 사용하는 별도의 opt-in production E2E 또는 deployment smoke가
담당한다.

CI와 신뢰 가능한 기본 실행에서는 테스트 전용 환경변수와 DB를 가진 server를 매번 직접
시작한다. app process crash, readiness timeout, port 충돌과 cleanup 실패는 테스트 실패다.

## Test Data and Database Isolation

각 테스트는 이전 테스트의 cookie·storage·DB 상태를 전혀 가정하지 않는다. 하나의 E2E DB를
공유하면 runner를 직렬로 실행하고, 각 테스트 시작 전에 모든 애플리케이션 collection을 정리한
뒤 기본 사용자·상품과 해당 시나리오에 필요한 데이터만 다시 seed한다. 병렬 실행은 worker별
독립 DB와 seed를 제공할 때만 허용한다.

선행 데이터와 식별자는 결정적인 테스트 전용 값으로 만들되 서로 충돌하지 않아야 한다. 제품이
생성하는 ID 자체가 검증 대상이 아니면 정규식이나 이후 사용자 결과로 관찰하고 특정 실행의
임의 값을 다른 테스트가 이어받지 않는다.

사용자 목표와 무관한 Arrange·Cleanup은 Playwright `request` fixture, 직접 DB helper 또는
test-only control plane으로 수행할 수 있다. test-only endpoint는 E2E 환경에서만 활성화하고
Production build에 노출하지 않는다. 검증 대상인 생성·수정·결제·권한 행동과 사용자 결과는
실제 `page` 흐름을 통과해야 하며 setup helper가 대신해서는 안 된다.

## Authentication State

로그인 자체를 검증하는 시나리오는 실제 로그인 form, cookie 발급과 redirect를 통과한다. 그 외
인증된 feature는 역할별 storage state를 새로운 Browser Context의 읽기 전용 초기 상태로
주입할 수 있다.

storage state는 테스트 전용 사용자와 server에서 실행마다 생성한다. 실제 계정 token을
포함하거나 저장소에 커밋하지 않는다. 테스트가 변경한 cookie, localStorage와 sessionStorage를
다음 테스트나 state 파일에 다시 저장해 이어받지 않는다.

## External Systems and Network

이메일, 결제, Cloudinary storage, 지도와 외부 HTTP API는 공식 adapter·SDK 또는 외부 origin의
network 경계에서 local fake server나 결정적인 test double로 대체할 수 있다.

```text
Browser → 실제 Next.js → 실제 Action / Route → 실제 Service → 실제 MongoDB
                              │
                              └→ 공식 Adapter → Local Fake External Service
```

test-only 분기는 제품의 공식 adapter 내부에만 제한하고 실제 SDK와 같은 성공·실패·redirect
계약을 모사한다. Service, Action, Route Handler와 business rule을 우회해서는 안 된다. 처리되지
않은 외부 network 요청은 즉시 실패시킨다.

외부 시스템의 실제 호환성은 기본 E2E가 증명하지 않는다. 실제 secret·비용·사람 개입이 필요한
검증은 opt-in contract, production smoke 또는 manual browser smoke로 분리한다.

## User Interaction and Locators

click, fill, select, keyboard와 upload는 Playwright locator를 통해 실제 browser에서 수행한다.
locator는 다음 순서를 기본으로 선택한다.

```text
getByRole
    ↓
getByLabel
    ↓
getByText
    ↓
getByPlaceholder
    ↓
data-testid 또는 공개 element ID
```

hidden file input, canvas와 vendor widget처럼 접근 가능한 경로가 없는 요소는 안정적인
`data-testid`나 명시적으로 공개한 element ID를 사용할 수 있다. styling class와 DOM hierarchy에
의존하지 않는다. 테스트가 event handler와 browser 내부 callback을 직접 호출해 사용자 경로를
우회해서는 안 된다.

## Assertions

URL, 보이는 content, 접근성 상태, 실제 download·popup·navigation과 사용자가 목록·상세·주문
내역에서 다시 조회한 결과를 우선 검증한다. hidden input, storage와 network 기록은 browser
계약이나 치명적인 중간 전이를 UI로 관찰할 수 없을 때만 보조 증거로 사용한다.

상품 등록과 주문 완료처럼 사용자가 UI에서 결과를 다시 확인할 수 있으면 DB를 반드시 직접
조회하지 않는다. 금액, 권한과 중복 생성처럼 UI가 노출하지 않는 핵심 불변조건이나 cleanup
대상 식별에는 DB 조회를 보조 assertion으로 사용할 수 있다. 사용자 결과 없이 DB 상태만
확인하면 Integration 책임에 가깝다.

내부 callback, 함수 호출 횟수, Service 인자와 DB query 구현은 검증하지 않는다. 큰 DOM
snapshot도 사용자 behavior의 증거로 사용하지 않는다.

## Async Behavior, Failure, and Diagnostics

Playwright의 locator assertion과 URL·response·popup 같은 관찰 가능한 조건이 제공하는
auto-wait를 사용한다. `waitForTimeout`과 임의 sleep, 실제 network 속도에 의존하지 않는다.
timeout을 늘려 race condition이나 readiness 실패를 숨기지 않는다.

최초 실패 후 retry에서 통과한 테스트도 flaky failure로 취급한다. retry는 trace와 재현 정보를
수집하는 진단 수단일 수 있지만 성공 판정을 만드는 수단이 아니다.

예상하지 않은 `pageerror`, `console.error`, unhandled rejection, `requestfailed`와 허용되지 않은
외부 network 요청은 실패로 취급한다. validation과 권한 거부처럼 의도한 4xx·5xx는 해당
request와 사용자 결과를 테스트에서 명시적으로 확인할 때만 허용한다. 광범위한 전역 allowlist로
Next.js나 vendor 오류를 숨기지 않는다.

실패 시 trace, screenshot, 관련 console·request와 server log를 보존한다. trace를 조사하거나
실패한 테스트에 연결할 때 `playwright-cli`를 사용할 수 있다.

## Browser and Visual Coverage

기본 `core` project는 Desktop Chromium에서의 핵심 사용자 behavior만 증명한다. mobile이 주요
사용 환경인 journey는 명시적인 mobile device project에서 별도로 실행한다. Firefox와 WebKit은
지원 정책 또는 실제 위험이 있는 흐름에만 추가한다.

element가 보인다는 assertion만으로 pixel-level layout을 증명하지 않는다. 반응형 배치, 겹침과
잘림이 계약이면 고정 viewport, 안정된 데이터와 animation 조건을 가진 별도 visual assertion
또는 E2E 시나리오를 사용한다.

## Time-dependent Flows

Playwright clock은 browser 시간만 변경하므로 Next.js server와 MongoDB 판단이 포함된 만료·예약
흐름에 단독으로 사용하지 않는다. 공식 clock 경계를 browser와 server에 일관되게 주입하거나,
만료 전·후의 결정적인 timestamp를 가진 데이터를 준비한다. 실제 시간이 흐르기를 기다리거나
OS 시간을 변경하지 않는다.

browser timer만의 UI behavior는 Component에서 우선 검증한다. E2E에서는 server와 결합된 사용자
목표에 필수인 시간 동작만 다룬다.

## Lifecycle and Artifacts

정상, assertion 실패와 실행 중단 경로 모두에서 Browser Context, child process, local fake
server, DB 연결과 MongoDB instance를 종료한다. 지연된 server 작업과 zombie process를 남기지
않으며 cleanup 실패도 테스트 실패로 처리한다.

실제 개인정보와 Production credential을 사용하지 않는다. storage state, trace, screenshot,
video와 request log는 민감한 artifact로 취급해 저장소에 커밋하지 않고 CI 접근 권한과 보존
기간을 제한한다. Authorization, cookie, 결제 secret과 form 비밀번호를 일반 log에 출력하지
않으며 필요한 진단 정보는 redaction한다.

임시 storage state와 성공 실행의 불필요한 로컬 artifact는 종료 후 정리한다. 실패 분석을 위해
보존하는 artifact의 위치와 수명은 runner 설정에서 관리한다.

## Manual Browser Smoke

실제 PortOne 결제처럼 실제 secret·비용과 사람의 카드사 인증이 필요한 테스트는 일반 E2E가
아니다. 별도 Playwright config와 명시적인 opt-in 명령을 가진 manual browser smoke로 관리하며
기본 CI gate에 포함하지 않는다.

manual smoke는 worker 하나와 retry 없이 실행한다. 성공, assertion 실패와 중단 여부에 관계없이
생성한 결제·파일 등 외부 자원을 `finally`에서 정리한다. 정리에 실패하면 payment ID와 수동
복구 절차를 남기고 smoke를 실패로 처리한다.

## What Not to Test

일반 E2E에서는 다음을 반복하거나 함께 검증하지 않는다.

- 모든 validation 입력과 business rule 분기
- Component의 loading·error·empty state 전체 조합
- Service 오류 매핑과 Mongoose schema·index의 세부 behavior
- 앱 자체 API·Action을 intercept해 만든 UI 전용 흐름
- 사용자 결과 없이 직접 DB 상태만 확인하는 테스트
- 내부 함수, callback, 호출 횟수와 DOM 구조
- 실제 Production DB, 실제 개인정보와 Production credential
- 기본 명령에서 실제 결제·메일·storage와 사람 개입
- Desktop Chromium 결과를 mobile·Firefox·WebKit 증거로 확대하는 것
- `next dev` 결과를 Production build·deployment 증거로 사용하는 것

## Examples

다음 예제는 실제 login, 상품 등록 form, upload, server와 DB 경로를 통과한 뒤 사용자가 목록에서
결과를 다시 확인한다. 각 테스트 전에 E2E harness가 DB를 reset하고 기본 관리자 계정을 다시
seed한다는 전제다.

```ts
import { expect, test } from "@playwright/test";

const image = {
  name: "product.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
};

test("ADMIN은 invitation 상품을 등록하고 목록에서 확인한다", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill("admin-e2e@example.com");
  await page.getByLabel("비밀번호").fill("Admin-e2e1!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/admin/products/new");
  await page.getByLabel("상품명 *").fill("E2E 초대장");
  await page
    .getByLabel("상품 설명 *")
    .fill("사용자 목표를 검증하는 충분히 긴 상품 설명입니다.");
  await page.getByLabel("기본 가격 *").fill("10000");
  await page.locator("#thumbnail-input").setInputFiles(image);
  await page.locator("#subCategory").click();
  await page.getByRole("option", { name: "청첩장" }).click();

  await page.getByRole("button", { name: "상품 등록" }).click();

  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(page.getByText("E2E 초대장")).toBeVisible();
});
```
