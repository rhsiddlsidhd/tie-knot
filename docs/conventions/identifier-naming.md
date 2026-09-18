# 식별자 명명 규칙

> Last updated: 2026-09-15

식별자의 문법적 선언 형태보다 코드에서 담당하는 역할을 먼저 판정한다. 같은 `const` 선언이라도 컴포넌트·함수·상수·지역 변수는 서로 다른 이름 규칙을 적용한다.

## 역할별 우선순위

위에서 먼저 일치하는 역할의 규칙을 적용한다.

| 역할                                   | 형식                                     | 예시                                           |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| 프레임워크가 이름을 지정한 export      | 프레임워크 요구 원형                     | `dynamic`, `revalidate`, `GET`                 |
| 타입·인터페이스·클래스                 | PascalCase                               | `OrderStatus`, `Product`, `AppError`           |
| 컴포넌트·Context·Provider·Schema·Model | PascalCase                               | `ProductCard`, `StoreProvider`, `ProductModel` |
| 함수                                   | camelCase                                | `calculatePrice`, `createAppStore`             |
| 훅                                     | `use` + PascalCase 조합의 전체 camelCase | `useAuth`, `useProductSearch`                  |
| 고정된 설정·정책·기준값                | SCREAMING_SNAKE_CASE                     | `API_SECRET`, `CACHE_REVALIDATE_SECONDS`       |
| 일반 변수                              | camelCase                                | `order`, `totalPrice`, `databaseClient`        |
| 프로젝트 소유 프로퍼티·메서드          | camelCase                                | `orderId`, `createdAt`, `calculateTotal`       |

더 구체적인 역할 규칙이 있는 하위 `AGENTS.md`가 이 공통 규칙보다 우선한다.

Next.js·React 등 프레임워크가 이름으로 API를 인식하는 export는 일반 식별자 케이스보다 프레임워크 계약을 우선한다. route segment config의 `dynamic`·`revalidate`·`maxDuration`, Route Handler의 `GET`·`POST`처럼 요구된 철자를 그대로 사용하며, 해당 파일의 네이밍 검사에서 명시적으로 제외한다.

### PascalCase 역할

- 컴포넌트는 JSX를 렌더하는 React 컴포넌트다.
- Context는 `createContext()`가 만든 React Context 객체다.
- Provider는 Context나 store를 하위 트리에 공급하는 React 컴포넌트다.
- Schema와 Model은 DB 문서 구조 또는 컴파일된 모델을 나타내는 Mongoose 아티팩트다.

이 값들이 모듈 스코프에서 한 번 초기화되더라도 상수 규칙보다 역할 이름을 우선한다.

```ts
const AppStoreContext = createContext<AppStoreApi | null>(null);
const ProductSchema = new Schema<Product>();
const ProductModel = model<Product>("Product", ProductSchema);
```

인터페이스에는 `I` 접두사를 붙이지 않는다. 선언 문법이 아니라 데이터의 역할을 이름에 표현한다.

```ts
interface Order {}
interface ProductDocument {}
interface PaymentRecord {}
interface CreateOrderInput {}
```

도메인 타입은 `Order`·`Product`, DB 문서는 `OrderDocument`, 저장 레코드는 `OrderRecord`, 입력 데이터는 `CreateOrderInput`처럼 구체적인 역할 suffix를 사용한다.

### 함수와 훅

함수는 camelCase로 짓는다. 훅은 전체 이름이 camelCase이면서 `use` 바로 다음 문자가 대문자여야 한다.

```ts
const calculatePrice = () => 0;
const useAuth = () => null;
```

### 약어

PascalCase와 camelCase 식별자 안의 약어는 일반 단어처럼 취급한다.

```ts
type ApiResponse = {};
type ProductJson = {};
const parseUrl = () => {};
const userId = "...";
```

PascalCase에서는 `Api`·`Json`·`Url`·`Id`, camelCase에서는 `api`·`json`·`url`·`id`로 쓴다. SCREAMING_SNAKE_CASE 상수에서는 `API_BASE_URL`·`JSON_CONTENT_TYPE`처럼 대문자를 유지한다. 외부 브랜드나 프로토콜이 식별자의 대소문자를 직접 요구하는 경우만 원형을 허용한다.

## 상수의 의미

다음 조건을 모두 만족하는 값은 고정된 설정·정책·기준값으로 판정한다.

1. 선언 위치와 관계없이 실행 흐름·입력에 따라 값이 달라지지 않는다.
2. 선언된 생명주기 동안 소비자가 변경하지 않는다.
3. 요청·사용자·함수 호출마다 달라지는 결과가 아니다.
4. 코드의 설정·정책·판단 기준으로 사용된다.
5. 값을 바꾸면 해당 코드의 설정·정책·판단 기준이 바뀐다.

상수 여부는 초기화식의 문법으로 판정하지 않는다. 리터럴, 계산식, 환경변수 참조 또는 함수 호출 결과도 위 조건을 만족하면 모두 상수다.

```ts
const MOBILE_BREAKPOINT = 768;
const CACHE_REVALIDATE_SECONDS = 60 * 60 * 24;
const API_SECRET = process.env.API_SECRET;
const ENCODED_KEY = createKey(API_SECRET);
```

배포마다 값이 다른 환경변수도 한 애플리케이션 실행 동안 고정된 설정이면 상수다. 다른 상수에서 한 번 계산한 결정적 파생값도 같은 기준을 적용한다.

선언 위치는 상수 여부를 결정하지 않는다. 함수나 컴포넌트 내부에서 한 곳만 사용하는 값도 실행 흐름과 무관한 고정 정책·기준이면 SCREAMING_SNAKE_CASE로 짓는다.

```ts
const calculatePrice = (price: number) => {
  const DISCOUNT_RATE = 0.1;
  const discountedPrice = price * (1 - DISCOUNT_RATE);
  return discountedPrice;
};
```

### 런타임 객체

연결·세션·캐시처럼 자체 상태와 생명주기를 가진 객체는 한 번 생성되더라도 런타임 리소스이므로 camelCase로 짓는다.

```ts
const databaseClient = createDatabaseClient();
const responseCache = new Map<string, Response>();
```

`Date`·`Map`·`Set`·`URL`처럼 내부 상태를 변경할 수 있는 내장 객체도 공유 상수로 두지 않고 camelCase로 짓는다. 고정 기준은 원시값이나 불변 객체로 분리하고, 가변 인스턴스는 작업마다 생성한다.

```ts
const SERVICE_START_DATE_ISO = "2026-01-01T00:00:00Z";

const getServiceStartDate = () => {
  const serviceStartDate = new Date(SERVICE_START_DATE_ISO);
  return serviceStartDate;
};
```

`Readonly<Date>`처럼 읽기 전용 타입을 붙여도 `setDate()` 등의 변경 메서드는 제거되지 않는다. `ReadonlyMap`·`ReadonlySet`도 해당 참조를 통한 변경만 제한할 뿐 원본 인스턴스의 불변성을 보장하지 않으므로, 가변 인스턴스 자체를 고정 기준값으로 취급하지 않는다.

### 객체·배열 상수의 불변성

SCREAMING_SNAKE_CASE 객체·배열은 바인딩뿐 아니라 내부 값도 변경하지 않는다. 가능한 경우 `as const` 또는 `Readonly` 타입으로 의도를 구조적으로 표현한다.

```ts
const USER_ROLES = ["USER", "ADMIN"] as const;

const ORDER_STATUS_LABELS = {
  PENDING: "주문대기",
  COMPLETED: "완료",
} as const;
```

이 객체·배열에 대한 속성 대입, 인덱스 대입, `push`, `splice`, `sort` 등 mutation은 금지한다. 내부 값이 실행 중 변경되어야 한다면 상수가 아니라 camelCase 상태·컬렉션으로 선언한다.

### 정적 UI 구성 데이터

실행 흐름이나 사용자 입력과 무관하게 UI의 선택지·필드·라벨·표시 방식을 정의하는 불변 데이터는 기준값이므로 SCREAMING_SNAKE_CASE로 짓는다.

```ts
const PAYMENT_METHOD_OPTIONS = [
  { value: "CARD", label: "카드" },
  { value: "TRANSFER", label: "계좌이체" },
] as const;

const PASSWORD_FIELDS = [
  { name: "currentPassword", label: "현재 비밀번호" },
  { name: "newPassword", label: "새 비밀번호" },
] as const;
```

같은 데이터에서 출발해도 props·API·권한·locale 등 런타임 입력에 따라 계산한 결과는 camelCase로 짓는다.

```ts
const visiblePaymentMethods =
  PAYMENT_METHOD_OPTIONS.filter(canUsePaymentMethod);
const passwordFields = createPasswordFields(locale);
```

### 정규식

검증·파싱 기준으로 고정해 공유하는 정규식은 SCREAMING_SNAKE_CASE로 짓는다. 단, `g` 또는 `y` 플래그가 있는 정규식은 실행할 때 `lastIndex` 상태가 변경되므로 공유 상수로 두지 않고 작업마다 camelCase 지역 변수로 생성한다. 런타임 입력으로 조합하는 정규식도 camelCase로 짓는다.

```ts
const OBJECT_ID_HEX_PATTERN = /^[0-9a-fA-F]{24}$/;

const findTokens = (value: string) => {
  const tokenPattern = /token/g;
  return [...value.matchAll(tokenPattern)];
};
```

전역·고정 검색 패턴을 재사용해야 한다면 불변인 패턴 원문만 상수로 두고 상태를 갖는 정규식 객체는 작업마다 생성한다.

```ts
const TOKEN_PATTERN_SOURCE = "token";

const findTokens = (value: string) => {
  const tokenPattern = new RegExp(TOKEN_PATTERN_SOURCE, "g");
  return [...value.matchAll(tokenPattern)];
};
```

## 일반 변수와의 경계

다음 값은 `const`로 선언해도 고정된 설정·정책·기준값이 아니므로 camelCase로 짓는다.

- 요청·사용자·입력에 따라 달라지는 결과
- 함수 안에서만 쓰는 지역 계산값
- 런타임 상태나 객체를 만들기 위한 초기값·seed·template
- 특정 테스트 시나리오의 fixture·mock·sample·expected 데이터
- 처리 과정에서 채우거나 변경하는 accumulator
- 내부 상태가 변하는 캐시와 가변 컬렉션
- 연결, 요청 또는 상태를 소유하는 런타임 리소스

```ts
const order = await getOrder(orderId);
const totalPrice = calculatePrice(order);
const initialFilterState = { keyword: "", isOpen: false };
const mockUser = { id: "user-1" };
const expectedResult = { success: true };
const results = [];
const cache = new Map();
const databaseClient = createDatabaseClient();
```

`const`는 식별자의 재할당만 막는다. 배열·객체 내부가 바뀌거나 현재 실행을 처리하기 위한 임시 결과라면 의미상 상수가 아니다. 초기 상태처럼 모듈 스코프에서 불변으로 선언되더라도 런타임 상태를 생성하기 위한 seed나 template이면 camelCase를 사용한다.

테스트 fixture·mock·sample·expected 데이터는 불변이어도 애플리케이션의 기준이 아니라 테스트 사례의 입력과 기대 결과이므로 camelCase로 짓는다. 테스트 timeout·고정 경로·환경 설정처럼 테스트 실행 자체의 정책인 값은 SCREAMING_SNAKE_CASE로 짓는다.

## 프로퍼티와 외부 계약의 경계

프로젝트가 소유하는 객체·타입·클래스의 프로퍼티와 메서드는 camelCase로 짓는다. 외부 API·Webhook·DB·프로토콜이 정한 키는 원본 계약을 정확히 표현하는 경계 DTO에서만 해당 형식을 허용하고, 내부로 전달하기 전에 프로젝트 소유 모델의 camelCase 키로 변환한다.

```ts
interface PaymentWebhookPayload {
  imp_uid: string;
  merchant_uid: string;
}

interface PaymentEvent {
  impUid: string;
  merchantUid: string;
}

const toPaymentEvent = (payload: PaymentWebhookPayload): PaymentEvent => ({
  impUid: payload.imp_uid,
  merchantUid: payload.merchant_uid,
});
```

외부 형식의 키를 편의상 내부 객체에 계속 전파하지 않는다. 계산된 키와 사람이 읽는 표시 문자열처럼 식별자가 아닌 키는 네이밍 검사에서 제외한다.

### 상수 객체 내부 키

상수 객체 자체는 SCREAMING_SNAKE_CASE로 짓되, 객체 구조와 의미를 설명하는 일반 필드는 camelCase로 짓는다. 일반 필드까지 상수 객체의 케이스를 전파하지 않는다.

```ts
const RETRY_POLICY = {
  maxAttempts: 3,
  delayMs: 1_000,
} as const;
```

도메인 코드나 외부 계약 값을 lookup key로 그대로 사용하는 경우에는 해당 값의 원형을 유지한다. 이 키는 일반 프로퍼티 이름이 아니라 조회 대상인 도메인 값이다.

```ts
const ORDER_STATUS_LABELS = {
  PENDING: "주문 대기",
  COMPLETED: "완료",
} as const;
```

도메인 값인지 일반 필드인지는 ESLint가 판별할 수 없으므로 문서와 코드 리뷰에서 확인한다.

### 클래스의 `static readonly` 멤버

`static readonly`는 재할당을 제한하는 문법일 뿐 의미상 상수를 보장하지 않는다. 다른 선언과 동일하게 역할로 판정한다.

```ts
class RetryPolicy {
  static readonly MAX_ATTEMPTS = 3;
  static readonly defaultOptions = createDefaultOptions();
  static readonly client = createClient();
}
```

고정 설정·정책·기준값은 SCREAMING_SNAKE_CASE로, 초기값·template·런타임 객체는 camelCase로 짓는다. 의미에 맞는 선택인지를 코드 리뷰에서 확인한다. 클래스와 직접 결합하지 않은 공통 상수는 가능한 경우 모듈 상수로 분리한다.

### Symbol 식별 토큰

의존성 주입·레지스트리·메타데이터에서 전역으로 공유하는 고정 Symbol은 식별 기준이므로 SCREAMING_SNAKE_CASE로 짓는다. 요청이나 작업마다 새로 생성하는 일회성 Symbol은 실행 결과이므로 camelCase로 짓는다.

```ts
const PAYMENT_SERVICE_TOKEN = Symbol("payment-service");
const requestToken = Symbol();
```

생성 목적은 ESLint가 판별할 수 없으므로 문서와 코드 리뷰에서 확인한다.

## 경계 사례

| 선언                                                | 판정                 | 이유                                     |
| --------------------------------------------------- | -------------------- | ---------------------------------------- |
| `const API_SECRET = process.env.API_SECRET`         | SCREAMING_SNAKE_CASE | 실행 동안 고정된 설정                    |
| `const CACHE_TTL = 60 * 60`                         | SCREAMING_SNAKE_CASE | 계산식이어도 고정 정책                   |
| 함수 내부 `const DISCOUNT_RATE = 0.1`               | SCREAMING_SNAKE_CASE | 선언 위치와 무관한 고정 정책             |
| `const STATUS_LABELS = { ... } as const`            | SCREAMING_SNAKE_CASE | 불변 기준표                              |
| `RETRY_POLICY.maxAttempts`                          | camelCase            | 상수 객체의 구조를 설명하는 일반 필드    |
| `ORDER_STATUS_LABELS.PENDING`                       | 도메인 형식 유지     | lookup key로 사용하는 도메인 코드        |
| `RetryPolicy.MAX_ATTEMPTS`                          | SCREAMING_SNAKE_CASE | 클래스에 결합된 고정 정책                |
| `RetryPolicy.defaultOptions`                        | camelCase            | 런타임 객체를 만들기 위한 template       |
| `const PAYMENT_SERVICE_TOKEN = Symbol(...)`         | SCREAMING_SNAKE_CASE | 전역에서 공유하는 고정 식별 토큰         |
| `const requestToken = Symbol()`                     | camelCase            | 작업마다 생성하는 일회성 식별자          |
| `const PAYMENT_METHOD_OPTIONS = [...] as const`     | SCREAMING_SNAKE_CASE | 정적 UI 구성 기준                        |
| `const visiblePaymentMethods = OPTIONS.filter(...)` | camelCase            | 런타임 조건에 따른 파생 결과             |
| `const initialState = { ... }`                      | camelCase            | 런타임 상태의 seed                       |
| `const mockUser = { ... }`                          | camelCase            | 특정 테스트의 fixture 데이터             |
| `const TEST_TIMEOUT_MS = 5_000`                     | SCREAMING_SNAKE_CASE | 테스트 실행 정책                         |
| `const OBJECT_ID_HEX_PATTERN = /^[0-9a-fA-F]{24}$/` | SCREAMING_SNAKE_CASE | 상태가 없는 고정 검증 기준               |
| 지역 `const tokenPattern = /token/g`                | camelCase            | 실행 중 `lastIndex`가 변하는 작업 객체   |
| `const serviceStartDate = new Date(...)`            | camelCase            | 내부 상태를 변경할 수 있는 가변 인스턴스 |
| `const SERVICE_START_DATE_ISO = "..."`              | SCREAMING_SNAKE_CASE | 가변 인스턴스와 분리한 불변 기준값       |
| `const order = await getOrder(id)`                  | camelCase            | 요청별 결과                              |
| `const results = []` 뒤에 `push`                    | camelCase            | 가변 accumulator                         |
| `const databaseClient = createClient()`             | camelCase            | 상태와 생명주기를 가진 리소스            |
| `const ProductModel = model(...)`                   | PascalCase           | Model 역할이 상수보다 우선               |

## 판정 질문

경계가 불분명하면 다음 질문을 사용한다.

> 이 값을 바꾸면 애플리케이션의 공통 설정·정책·판단 기준이 바뀌는가?

맞으면 SCREAMING_SNAKE_CASE 상수 후보이고, 현재 요청의 결과나 작업 상태만 바뀌면 camelCase 일반 변수다. 역할이 컴포넌트·Provider·Model·함수·훅이면 이 질문보다 역할별 규칙을 먼저 적용한다.
