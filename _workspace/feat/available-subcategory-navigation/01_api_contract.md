# 공개 상품 및 사용 가능한 서브카테고리 API 계약

## 1. 결정 요약

- 신규 Route Handler와 신규 Server Action은 만들지 않는다.
- 기존 공개 `GET /api/products`를 재사용하되, 반환 대상을 `deletedAt === null && status === "active"`인 공개 상품으로 제한한다.
- Server Component는 HTTP 왕복 없이 동일한 공개 상품 서비스와 사용 가능한 서브카테고리 서비스를 직접 호출한다.
- 관리자 목록은 기존처럼 공개 여부와 무관한 상태(`active`/`inactive`/`soldOut`)를 조회할 수 있어야 하며 휴지통 조회 계약도 유지한다. 공개 조회와 관리자 조회가 더 이상 같은 서비스 의미를 공유하지 않게 분리한다.
- `GET /api/products`의 성공 `data`는 기존과 동일하게 상품 배열이다. `{ items, total }`로 다시 감싸지 않는다.
- 사용 가능한 서브카테고리는 외부 API로 노출하지 않고 서버 서비스 결과로만 소비한다.

## 2. 공통 공개 가시성 규칙

모든 사용자용 **목록** 조회는 아래 predicate를 공유한다.

```ts
{ deletedAt: null, status: "active" }
```

적용 대상은 최소 다음과 같다.

- 카테고리 상품 페이지의 Server Component 직접 조회
- `GET /api/products`
- 홈의 사용 가능한 서브카테고리 집계
- 사용자용 검색 목록과 인기 상품 목록
- 추천 상품 목록(이미 같은 predicate를 사용하며 유지)

단일 상품 상세 조회, 주문 검증 조회, 관리자 조회는 각 유스케이스의 기존 계약을 유지하며 이 문서에서 공개 목록 조회로 재정의하지 않는다.

공개 응답의 런타임 불변조건은 다음과 같다.

```ts
product.status === "active"
product.deletedAt === null
```

`ProductResponse` 공용 스키마의 `status` enum과 nullable `deletedAt` 필드는 관리자 등 다른 소비처와의 호환성을 위해 좁히지 않는다.

## 3. Route Handler 계약

### `GET /api/products`

| 항목 | 계약 |
|---|---|
| 경로 | `/api/products` |
| 메서드 | `GET` |
| 채널 | B — Route Handler, 브라우저 `useSWR` 재검증용 |
| 인증 | 불필요(공개) |
| 요청 | query `category?: string` |
| 성공 | HTTP 200, `{ success: true, data: ProductResponse[] }` |
| 목록 wrapping | 배열 그대로 `data`에 둔다. `{ items, total }` 없음 |
| 실패 | HTTP 500, `{ success: false, error: { category: "INTERNAL", message } }` |
| 처리 방식 | 즉시 동기 HTTP 응답. 비동기 작업/폴링 없음 |

#### 요청 규칙

- `category`가 없으면 모든 카테고리의 공개 상품을 반환한다.
- `category`가 있으면 해당 문자열과 일치하는 카테고리의 공개 상품만 반환한다.
- 기존 호환성을 유지해 알 수 없는 `category`는 `VALIDATION` 에러가 아니라 성공한 빈 배열로 처리한다.
- `subCategory` query는 이 엔드포인트에 추가하지 않는다. 현재 상품 필터는 받아 온 공개 상품을 클라이언트에서 필터링하며, 이번 요구사항에 별도 네트워크 필터가 필요하지 않다.

#### 성공 예시

```json
{
  "success": true,
  "data": [
    {
      "_id": "66c000000000000000000001",
      "category": "favor",
      "subCategory": "candle",
      "status": "active",
      "deletedAt": null
    }
  ]
}
```

위 예시는 가시성 관련 필드만 축약해 표시했다. 실제 원소 shape는 기존 `ProductResponse` 전체를 그대로 유지한다.

#### 에러 규칙

- DB 연결/조회/직렬화 실패는 `INTERNAL`로 분류한다.
- `routeError`가 안전한 메시지와 HTTP 500으로 변환한다.
- 빈 결과는 에러가 아니며 HTTP 200과 빈 배열을 반환한다.
- 인증 및 인가가 없으므로 `UNAUTHENTICATED`/`FORBIDDEN`은 이 엔드포인트에서 발생하지 않는다.

## 4. 서버 서비스 계약

### 4.1 공개 상품 목록

```ts
getPublicProductsService(
  category?: string,
  userId?: string,
): Promise<ProductJSON[]>
```

- 항상 공개 predicate를 적용한다.
- `category`가 있으면 완전 일치 필터를 추가한다.
- 기존 정렬 `isFeatured DESC, priority DESC, createdAt DESC`를 유지한다.
- `GET /api/products`와 `/products/[category]` Server Component가 모두 이 서비스를 호출한다.
- `userId`가 없으면 기존과 같이 `isLiked: false`로 직렬화한다.
- 결과 없음은 `[]`, DB 실패는 throw다.

기존 `getAllProductsService`는 관리자 목록 전용 의미로 남긴다. `view="active"`는 소프트 삭제되지 않은 전체 상태, `view="trash"`는 소프트 삭제된 상품을 반환하는 현재 관리자 계약을 유지한다. 공개 Route Handler나 사용자 페이지가 이 서비스를 호출하면 안 된다.

### 4.2 사용 가능한 서브카테고리

```ts
type AvailableSubCategory = {
  category: ProductCategory;
  subCategory: SubCategory;
};

getAvailableSubCategoriesService(
  category?: ProductCategory,
): Promise<AvailableSubCategory[]>
```

서비스 결과 규칙:

1. DB에서는 공개 predicate에 맞는 상품의 `(category, subCategory)` pair를 집계하고 중복을 제거한다.
2. DB 집계 결과를 그대로 반환하지 않는다.
3. `PRODUCT_CATEGORIES` 순서대로 순회하고, 각 카테고리 안에서는 `SUB_CATEGORY_MAP[category]` 순서대로 순회해 DB pair와의 교집합만 결과에 넣는다.
4. 중복 pair, 알 수 없는 레거시 category/subCategory, 카테고리와 서브카테고리의 잘못된 조합은 제외한다.
5. `category`가 주어지면 그 카테고리만 집계/반환하되 반환 원소는 동일한 pair shape를 유지한다.
6. 결과 없음은 `[]`, DB 실패는 throw다.

홈 소비 shape:

```ts
Array<{ category: ProductCategory; subCategory: SubCategory }>
```

상품 페이지는 이 DB 서비스를 다시 호출하지 않는다. 이미 조회한 공개 상품 배열의 동일 스냅샷에서 현재 카테고리의 정의 순서로 키를 파생한다.

```ts
const availableSubCategories = SUB_CATEGORY_MAP[category].filter(
  (subCategory) => products.some((product) => product.subCategory === subCategory),
);
```

별도 상품 조회와 집계를 병렬로 실행하지 않으므로 두 쿼리 사이에 상품 상태가 바뀌어 초기 선택값과 상품 배열이 어긋나는 race를 만들지 않는다. 서비스가 항상 pair를 반환하는 계약은 유지한다. 향후 다른 서버 소비처가 category 인자를 사용해도 소속 정보가 유실되지 않고 호출 위치별 union이 생기지 않는다.

### 4.3 다른 공개 목록 서비스 정렬

- `searchProductsService`와 `getPopularProductsService`에도 공개 predicate를 적용한다.
- `getFeaturedTemplatesService`는 이미 `status: "active", deletedAt: null`을 사용하므로 유지한다.
- 응답 shape와 정렬 규칙은 변경하지 않는다.

## 5. Server Component 및 UI 경계 계약

### 홈 `/`

- `getAvailableSubCategoriesService()`를 직접 호출한다.
- 성공 결과를 `availableSubCategories` prop으로 전달한다.
- 홈 탐색은 부가 섹션이므로 조회 실패는 기존 홈 섹션 degradation 관행에 맞춰 `[]`로 흡수한다.
- `[]`이면 서브카테고리 탐색 섹션 전체를 렌더하지 않는다. 빈 캐러셀이나 오류 안내를 만들지 않는다.

### 카테고리 상품 페이지 `/products/[category]`

- 유효한 `category`를 확인한 뒤 공개 상품을 서버에서 한 번 조회한다.

```ts
const products = await getPublicProductsService(category);
const availableSubCategories = SUB_CATEGORY_MAP[category].filter(
  (subCategory) => products.some((product) => product.subCategory === subCategory),
);
```

- 상품 조회가 실패하면 빈 배열로 숨기지 않고 throw를 전파해 기존 `(products)/error.tsx` 경계에서 처리한다.
- `availableSubCategories`가 비어 있으면 필터에는 `all`만 표시하고 기존 상품 준비 중 empty state를 유지한다.
- 최초 query 검증과 최초 필터 옵션은 같은 `products` 스냅샷에서 파생한 available 목록을 사용한다.
- SWR 재검증 뒤에는 현재 공개 `data`에서 같은 순수 규칙으로 필터 옵션을 다시 파생한다. 이번 범위에서는 기존 필터 상태 전이를 변경하지 않으며, 선택값 자동 보정은 추가하지 않는다.
- `GET /api/products` 재검증 결과도 공개 상품만 포함하므로 클라이언트는 공개되지 않은 상품으로 필터 항목을 만들 수 없다.

### `subCategory` 딥링크 폴백

서버 페이지 경계가 초기 선택값을 결정한다.

```ts
const initialSubCategory =
  typeof querySubCategory === "string" &&
  availableSubCategories.includes(querySubCategory as SubCategory)
    ? (querySubCategory as SubCategory)
    : "all";
```

- 현재 카테고리의 공개 상품이 있는 subCategory만 선택값으로 인정한다.
- 다른 카테고리 소속 값, 상품 없는 값, 레거시 값, 알 수 없는 값, 배열 query, 누락은 모두 `all`이다.
- URL redirect나 canonical query 재작성은 하지 않는다. 폴백은 UI 선택 상태에만 적용한다.

## 6. 스키마 변경 여부

- 신규 request/response zod 스키마는 필요하지 않다.
- `GET /api/products`는 기존 `ProductResponse[]` 계약을 유지한다.
- available 결과는 서버 내부의 정적 도메인 타입으로 제한되며 네트워크 경계를 통과하지 않는다.
- 필드명은 기존 모델과 동일한 camelCase `category`, `subCategory`를 사용한다.

## 7. DB 및 호환성 메모

- 기존 Product 문서에 필요한 `category`, `subCategory`, `status`, `deletedAt`가 모두 있어 스키마 변경과 backfill은 필요하지 않다.
- 이번 계약만으로 신규 인덱스를 추가하지 않는다. 낮은 카디널리티 필드 조합이며 실제 성능 계측 근거가 없다. 병목이 확인되면 공개 문서 대상 partial compound index를 별도 검토한다.
- 공개 API의 envelope, 상품 원소 shape, 정렬, 알 수 없는 category의 빈 배열 동작을 유지하므로 소비자 호환성을 깨지 않는다. 달라지는 것은 inactive/soldOut 상품이 공개 목록에서 제외되는 점뿐이며 이는 요구된 정책 변경이다.

## 8. 검증 가능한 수용 조건

- 공개 GET과 사용자 카테고리 페이지가 같은 데이터에서 동일한 공개 상품 집합을 반환한다.
- 관리자 목록에는 inactive/soldOut 상품이 계속 나타나지만 공개 GET/사용자 목록에는 나타나지 않는다.
- active라도 `deletedAt !== null`이면 모든 공개 목록과 available 집계에서 제외된다.
- 동일 pair의 공개 상품이 여러 개여도 available 결과에는 한 번만 나타난다.
- 레거시 또는 잘못된 pair는 available 결과에서 제외된다.
- available 결과 순서는 DB 반환 순서가 아니라 `PRODUCT_CATEGORIES`와 `SUB_CATEGORY_MAP` 정의 순서다.
- 다른 카테고리 소속이거나 상품이 없는 유효 subCategory query도 `all`로 폴백한다.
- 신규 endpoint, pagination wrapping, 인증 요구사항, 비동기 결과 채널은 추가되지 않는다.

## 9. 미해결 쟁점

없음. API/UI/DB 설계자 협의 결과를 반영했다.
