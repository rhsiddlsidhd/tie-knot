# Integration Test

## Purpose

Integration Test는 제품의 서버·데이터 코드가 실제 Mongoose와 격리된 MongoDB에
연결되었을 때 **경계 사이의 계약이 올바르게 동작하는지** 검증한다.

파일명, 위치, 실행 명령, Arrange → Act → Assert와 공통 격리 원칙은
[`README.md`](README.md)를 따른다.

## Scope

실제 MongoDB 통과는 Integration의 필요조건이지만 충분조건은 아니다. 테스트는
프로덕션 import 경로를 사용하면서 서버 또는 데이터 계층의 계약을 관찰해야 한다.
별도의 Repository 계층은 없으며, 일반적인 업무 흐름에서 Service가 Mongoose Model을
통해 MongoDB에 직접 접근한다.

주요 대상은 다음과 같다.

- `dbConnect` → Mongoose → MongoDB
- Mongoose Model → MongoDB
- Service → Mongoose Model → MongoDB
- Server Action → Service → Mongoose Model → MongoDB
- Route Handler → Service → Mongoose Model → MongoDB
- Server Component / Page → Service → Mongoose Model → MongoDB
- 여러 Service와 Model이 참여하는 transaction과 상태 전이

모든 Integration Test는 다음 조건을 충족해야 한다.

1. 실제 Mongoose와 격리된 MongoDB 인스턴스를 통과한다.
2. 검증 대상 경로는 프로덕션 import와 실제 연결 구조를 사용한다.
3. 해당 경계의 반환 결과, 오류, 저장 상태 또는 직접 관찰 가능한 계약을 검증한다.
4. React UI를 렌더링하거나 사용자 관찰 결과와 브라우저 흐름을 함께 검증하지 않는다.

Service를 반드시 통과해야 하는 것은 아니다. `dbConnect`, schema validation,
index·unique constraint, middleware·hook, transaction helper처럼 데이터 계층 자체가
대상이면 Mongoose와 MongoDB의 경계를 직접 검증한다. 반대로 MongoDB에 한 번
접근했다는 이유만으로 무관한 서버·UI 테스트를 Integration으로 분류하지 않는다.

Server Action은 함수를 직접 호출해 action 결과와 DB 효과를 검증한다. Next.js의 RPC
전송 자체는 포함하지 않는다.

Route Handler는 `Request` 또는 `NextRequest`로 handler를 직접 호출해 요청 해석,
HTTP status, 응답 envelope와 DB 결과를 검증한다. 실제 서버, URL routing과 네트워크
전송은 포함하지 않는다.

Server Component와 Page는 함수를 호출한 뒤 반환된 React tree의 타입·props·데이터
전달만 확인할 때 Integration으로 허용한다. 하위 Component를 렌더링하거나 사용자
관찰 결과를 검증하면 Component Test로 분리한다.

같은 사용자 시나리오라도 Service 결과와 DB 상태는 Integration에서 검증하고, React
렌더링은 factory 또는 fixture로 동등한 입력을 만들어 Component Test에서 독립적으로
검증한다. 실제 URL·네트워크·브라우저 탐색은 E2E가 담당한다.

## Directory Structure

Integration Test는 대상 제품 코드 옆 `src/`에 두지 않고 `test/integration/`에서
관리한다. 디렉터리는 검증을 시작하는 서버 진입점 또는 데이터 책임에 따라 나눈다.

```text
test/integration/
├── actions/    # Server Action과 Service, MongoDB 결합
├── app/        # Route Handler, Server Component, Page
├── db/         # Mongoose와 MongoDB 연결
├── services/   # Service와 Mongoose Model 결합
└── ...         # 검증 대상 제품 코드의 다른 소유 경계
```

위 디렉터리는 현재 책임 영역의 예시이며 허용 목록이 아니다. 테스트가 Integration인지
먼저 [Scope](#scope)에 따라 판정한 뒤 `test/integration/` 아래에 배치한다. 첫 번째
하위 디렉터리는 검증 대상 제품 코드의 소유 경계에 맞추며, 기존 경계로 표현할 수 없을
때만 새 최상위 디렉터리를 추가한다.

## Database

Integration Test는 Vitest의 Node 환경에서 실행하며, 실제 MongoDB behavior와
transaction을 검증하기 위해 `mongodb-memory-server`의 단일 노드 replica set을
사용한다.

```text
Integration Test
       ↓
제품 서버·데이터 코드
       ↓
Mongoose
       ↓
mongodb-memory-server replica set
```

검증 대상 경로의 Mongoose Model과 Service는 Mock하지 않는다. Production MongoDB에도
연결하지 않는다.

## Why mongodb-memory-server

Integration Test에는 실제 MongoDB의 query, index, transaction behavior가 필요하지만
개발자 또는 CI 환경의 외부 MongoDB에 의존해서는 안 된다. 테스트 실행 시 고정된
MongoDB 버전의 독립 replica set을 생성하고 `MONGO_TEST_URI`를 주입한다.

## Environment

`npm run test:integration`은 개발자의 `.env`, 실제 secret과 외부 서비스 연결 없이
실행되어야 한다. 제품 모듈의 import에 필요한 비밀이 아닌 형식상 값은 setup에서
안전하고 결정적인 테스트 전용 값으로 주입한다. 예를 들어 `JWT_SECRET`,
`ENTRY_JWT_SECRET`, `PORTONE_API_SECRET`의 실제 값에 의존하지 않는다.

특정 테스트가 필수 설정을 요구하면 suite 실행 초기에 누락된 환경변수의 이름과 원인을
명시해 실패해야 한다. 테스트가 `process.env`를 변경하면 종료 전에 원래 값으로 복구한다.
실제 외부 secret과 서비스를 통과하는 검증은 이 문서와 기본 Integration project의
범위 밖이다. 도입할 때 별도의 opt-in contract 또는 smoke 문서·project·명령을 먼저
정의한다.

## Test Data

Integration Test는 `@test/support`의 순수 factory로 유효한 입력을 만들고 검증에 필요한
값만 override한다. factory는 DB에 쓰지 않으며, 테스트 간에 Document나 식별자를
공유하지 않는다.

검증 대상 코드를 Arrange와 Assert에 다시 사용하지 않는다. Service 쓰기 동작은 factory와
Model로 선행 데이터를 준비하고, 실행 후 Model의 직접 조회나 필요한 경우 raw collection으로
저장 상태를 확인한다. Service 읽기 동작도 Model 또는 factory로 데이터를 준비한다. 같은
Service를 Arrange·Act·Assert에 반복 사용해 서로의 결함을 가려서는 안 된다. 여러 호출에
걸친 Service 자체의 상태 전이가 대상이면 각 단계의 DB 상태를 독립적으로 관찰한다.

시간을 검증하는 테스트만 공식 clock 경계 또는 fake timer를 사용하고 종료 전에 복구한다.
MongoDB driver, session, TTL과 timeout이 사용하는 실제 타이머를 전역으로 고정하지 않는다.
factory의 ID와 난수 데이터는 테스트별로 충돌하지 않아야 하며, 실패를 재현할 수 있도록
명시값이나 seed를 사용할 수 있어야 한다. 정렬·만료·중복처럼 값 자체가 결과에 영향을
주면 Arrange에서 값을 명시한다.

## Isolation

Integration project는 하나의 replica set을 공유하므로 테스트 파일을 직렬로 실행한다.
각 테스트는 이전 상태를 가정하지 않고, Arrange 전에 `clearCollections`로 모든 애플리케이션
컬렉션의 document를 삭제한 뒤 필요한 데이터만 생성한다. 정리 실패는 테스트 실패로
취급한다. 일반 격리를 transaction rollback에 의존해서는 안 된다.

공용 DB에서 파일 병렬 실행을 활성화하면 한 테스트의 cleanup이 다른 테스트의 데이터를
삭제하므로 허용하지 않는다. 병렬 실행은 worker마다 독립 DB를 제공할 때만 허용한다.

일반 cleanup은 document만 삭제하고 collection과 index는 유지한다. unique·TTL·compound
index 테스트는 assertion 전에 `Model.init()` 등으로 index 생성 완료를 기다린다. 전역
setup에서 `syncIndexes()`처럼 기존 index를 변경하거나 삭제할 수 있는 작업은 실행하지
않는다. index 구조를 변경하는 테스트는 전용 DB를 사용하고 종료 시 폐기한다.

각 suite는 Mongoose 연결과 session을 닫고, global teardown은 replica set을 중지한다.
테스트가 만든 timer, background job, 환경변수 변경과 Mock도 종료 전에 복구한다. 정리되지
않은 handle이나 지연된 DB 쓰기가 남으면 테스트 실패로 취급한다.

## Transactions and Failure Paths

transaction 성공은 반환값과 commit 이후의 DB 상태를 확인한다. 실패는 중간 쓰기 이후
오류를 발생시켜 오류 결과와 rollback 이후의 DB 상태를 모두 확인한다. transaction 검증은
실제 transaction을 지원하는 replica set에서만 수행한다.

이메일, 결제, storage 같은 비DB side effect는 MongoDB rollback 대상이 아니다. 공식
adapter 경계에서 대체하고 DB commit이 실패하면 호출되지 않는지 확인한다. 이미 실행된
외부 효과의 보상이나 outbox behavior는 해당 흐름을 대상으로 하는 별도 Integration Test로
검증한다.

DB를 변경하는 성공 경로는 변경된 상태와 보존되어야 할 핵심 불변조건을 확인한다. 실패
경로는 의도하지 않은 변경이 없음을 확인한다. 읽기 전용 Service는 실제 MongoDB에 준비한
데이터로 결과를 검증하면 충분하며 의미 없는 전체 DB snapshot을 만들지 않는다. `dbConnect`,
schema, index처럼 document 변경이 목적이 아닌 테스트는 연결 재사용, validation 오류,
constraint 적용 등 해당 경계의 직접 관찰 결과를 검증한다.

## What to Test

- Document 생성·조회·수정·삭제와 보존되어야 할 불변조건
- query 조건, 정렬, pagination과 atomic update
- schema validation, default, discriminator와 middleware·hook
- index와 unique·TTL·compound constraint
- Service와 실제 Mongoose Model의 결합
- transaction commit, rollback과 여러 Model의 상태 전이
- DB 상태에 따른 domain 결과와 오류
- Server Action과 Route Handler의 반환 계약 및 DB 효과
- Server Component와 Page가 반환 React tree에 전달하는 데이터

## What Not to Test

Integration Test에서는 다음을 반복하거나 함께 검증하지 않는다.

- 순수 함수의 모든 분기
- React 렌더링과 사용자 관찰 결과
- Hook → SWR → fetch → MSW 흐름
- browser interaction과 실제 URL·네트워크 전송
- 실제 Production MongoDB
- 외부 API의 실제 동작
- 검증 대상 Service나 그 반환값을 Mock해 만든 인위적인 연결
- 다른 테스트 파일이 만든 DB 상태를 이어받는 시나리오

## Mocking

검증 대상 경로인 Service → Mongoose Model → MongoDB는 절대 Mock하지 않는다. 테스트
대상 Service나 반환값을 Mock해 연결을 인위적으로 만들면 Integration으로 인정하지 않는다.

인증 session이나 현재 시각처럼 현재 테스트의 독립된 선행 조건은 제품의 공식 경계에서
부분 Mock할 수 있다. 테스트에는 제외한 경계와 이유를 명시하고, 그 경계 자체는 별도
Integration Test가 담당해야 한다. 모듈 전체를 대체하지 말고 실제 구현을 유지한 채 필요한
export만 대체한다.

PortOne, Cloudinary, Nodemailer, Kakao와 공공 API처럼 네트워크·비용·외부 부작용이 있는
시스템은 Adapter 또는 SDK 경계에서 대체하고 호출 인자와 시점을 검증한다. Integration
runner는 모든 외부 네트워크를 차단하고, 처리되지 않은 요청을 즉시 실패시키도록 구성한다.
Hook → SWR → fetch → MSW는 Component Test이고, 실제 외부 API 호환성은 이 문서의
범위 밖인 opt-in contract 또는 smoke test가 담당한다.

## API Integration

Route Handler는 실제 HTTP server를 띄우지 않고 exported handler를 직접 호출한다.

```text
Request / NextRequest
          ↓
Route Handler
          ↓
실제 Service → Mongoose Model → MongoDB
          ↓
Response contract + DB state
```

쓰기 endpoint는 HTTP status와 응답 envelope뿐 아니라 DB 변경과 핵심 불변조건을 확인한다.
읽기 endpoint는 실제 DB에 준비한 데이터와 응답 계약을 확인하며 불필요한 DB snapshot은
만들지 않는다.

## Examples

다음 예제는 Service 결과와 독립된 Model 조회로 저장 상태를 검증하고, 실패 경로에서
의도하지 않은 저장이 없음을 확인한다.

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db";
import { ProductModel } from "@/models";
import { createProductService } from "@/services/product";
import { buildProductInput, clearCollections } from "@test/support";

describe("createProductService", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("상품을 생성하고 기본값을 저장한다", async () => {
    const input = buildProductInput();

    const result = await createProductService(input);

    expect(result).toBe(true);
    const saved = await ProductModel.findOne({ title: input.title }).lean();
    expect(saved).toMatchObject({ title: input.title, status: "active" });
  });

  it("schema validation에 실패하면 상품을 저장하지 않는다", async () => {
    const input = buildProductInput({ title: undefined as unknown as string });

    await expect(createProductService(input)).rejects.toMatchObject({
      category: "INTERNAL",
    });

    expect(await ProductModel.countDocuments()).toBe(0);
  });
});
```

Route Handler는 실제 server 대신 `NextRequest`로 직접 호출한다. 읽기 경로이므로 실제
MongoDB에 준비한 데이터와 응답 계약을 확인하고, 변경되지 않은 DB snapshot은 만들지 않는다.

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/products/route";
import { dbConnect } from "@/db";
import { MobileInvitationProductModel } from "@/models";
import { buildProductInput, clearCollections } from "@test/support";

describe("GET /api/products", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("공개 상품을 응답 envelope에 담아 반환한다", async () => {
    const input = buildProductInput({ title: "공개 상품" });
    await MobileInvitationProductModel.create(input);

    const response = await GET(
      new NextRequest("http://localhost/api/products"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      expect.objectContaining({ title: input.title }),
    ]);
  });
});
```
