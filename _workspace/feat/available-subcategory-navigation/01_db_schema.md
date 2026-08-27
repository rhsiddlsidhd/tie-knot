# 공개 상품·가용 서브카테고리 DB 설계

## 1. 결론

| 항목 | 결정 |
| --- | --- |
| Product 필드 변경 | **없음** |
| 신규 모델/컬렉션 | **없음** |
| 신규 인덱스 | **없음** |
| 기존 문서 backfill | **없음** |
| 데이터 마이그레이션 | **없음** |
| 공개 상품 조건 | `{ deletedAt: null, status: "active" }` |
| 가용 서브카테고리 반환 | `Array<{ category: ProductCategory; subCategory: SubCategory }>` |

이번 기능은 Product 문서에 이미 저장되는 `category`, `subCategory`, `status`, `deletedAt`만으로 구현할 수 있다. 따라서 `src/models/product.model.ts`를 변경하지 않는다. 공개 여부나 가용 분류를 별도 필드로 중복 저장하지 않으며, 공개 상품의 현재 상태에서 조회 시점에 계산한다.

## 2. 기존 Product 스키마 적합성

현재 `src/models/product.model.ts`의 관련 필드는 다음과 같다.

| 필드 | 현재 타입/제약 | 이번 기능에서의 역할 | 변경 여부 |
| --- | --- | --- | --- |
| `category` | `ProductCategory`, required, `PRODUCT_CATEGORIES` enum | 분류 소속과 코드 정의 교집합의 상위 키 | 없음 |
| `subCategory` | `SubCategory`, required, `SUB_CATEGORY_MAP[category]` 비동기 validator | 가용 서브카테고리 집계 키 | 없음 |
| `status` | `active \| inactive \| soldOut \| deleted`, default `active` | 공개 가능 상태 판별 | 없음 |
| `deletedAt` | `Date \| null`, default `null` | 소프트 삭제 제외 | 없음 |

`category`와 `subCategory`의 조합은 신규 저장 및 검증을 거친 수정에서 이미 `SUB_CATEGORY_MAP`으로 검사된다. 다만 MongoDB에는 과거 코드나 직접 삽입으로 생성된 레거시 문자열이 남아 있을 수 있으므로, DB 집계 결과를 `SubCategory`로 곧바로 캐스팅해서는 안 된다. §4의 코드 정의 교집합이 읽기 경계의 방어선이다.

### 기각한 필드

- `isPublic`: `status === "active" && deletedAt === null`의 파생값이다. 저장하면 상태 변경·삭제·복구 때 함께 갱신해야 하므로 불일치 상태를 새로 만든다.
- `hasProducts`, `availableSubCategories`: 상품의 추가·상태 변경·소프트 삭제·복구마다 동기화가 필요한 역정규화 값이다. 현재 요구 규모와 정합성 비용에 비해 이점이 없다.
- 별도 Category/SubCategory 컬렉션: 분류의 유효성·순서는 `PRODUCT_CATEGORIES`와 `SUB_CATEGORY_MAP`이 단일 원본이다. DB에 같은 taxonomy를 복제하지 않는다.

## 3. 공개 조회와 관리자 조회의 분리

### 3.1 공개 predicate

사용자 화면과 공개 상품 API에서 상품을 반환하거나 노출 가능 여부를 계산하는 조회는 다음 조건을 공통으로 사용한다.

```ts
const PUBLIC_PRODUCT_FILTER = {
  deletedAt: null,
  status: "active",
} as const;
```

이 조건은 다음 공개 조회에 동일하게 적용되어야 한다.

| 조회 | 현재 상태 | 확정 조건 |
| --- | --- | --- |
| 사용자 카테고리 상품 목록 | `deletedAt: null` | `deletedAt: null`, `status: "active"` |
| `GET /api/products` | 사용자 목록과 같은 서비스 사용 | 공개 전용 서비스의 동일 조건 |
| 공개 상품 검색 | `deletedAt: null` | `deletedAt: null`, `status: "active"` |
| 홈 인기 상품 | `deletedAt: null` | `deletedAt: null`, `status: "active"` |
| 홈 추천 상품 | 이미 두 조건 사용 | 유지 |
| 가용 서브카테고리 집계 | 신규 | `deletedAt: null`, `status: "active"` |

공개 목록과 관리자 목록이 같은 `getAllProductsService`를 공유한 채 내부 옵션으로만 분기하면 호출자가 옵션을 빠뜨릴 때 inactive/soldOut 상품이 공개될 수 있다. 서비스 이름과 진입점을 분리해 공개 조건을 기본값이 아니라 불변조건으로 둔다. 구체적인 서비스 명칭과 호출 경계는 `01_api_contract.md`가 소유한다.

### 3.2 관리자 조회

관리자 상품 목록은 현행 상태 관리 계약을 유지한다.

- 일반 관리 목록: `{ deletedAt: null }` — `active`, `inactive`, `soldOut`를 모두 볼 수 있어야 한다.
- 휴지통: `{ deletedAt: { $ne: null } }` — 소프트 삭제 문서를 볼 수 있어야 한다.
- 관리자 등록·수정·삭제·복구의 `status`/`deletedAt` 저장 규칙은 변경하지 않는다.

관리자 조회에 공개 predicate를 재사용하지 않는다. 특히 `status: "active"`를 관리자 일반 목록에 추가하면 상태를 inactive/soldOut로 바꾼 직후 관리 화면에서 상품이 사라져 운영 계약을 깨뜨린다.

## 4. 가용 서브카테고리 집계

### 4.1 서비스 계약

api-designer와 다음 계약으로 합의했다.

```ts
type AvailableSubCategory = {
  category: ProductCategory;
  subCategory: SubCategory;
};

getAvailableSubCategoriesService(
  category?: ProductCategory,
): Promise<AvailableSubCategory[]>;
```

- 인자가 없으면 홈 탐색용으로 모든 카테고리의 가용 pair를 반환한다. 이 기능의 주 소비 경로다.
- `category`가 있으면 해당 카테고리의 pair만 반환하는 계약도 유지한다.
- 상품 목록 페이지는 이 서비스를 공개 상품 조회와 별도로 병렬 호출하지 않는다. `getPublicProductsService(category)`가 반환한 동일 상품 배열에서 가용 pair를 같은 교집합/코드 순서 규칙으로 파생한다. 두 DB 조회 사이에 상품 상태가 바뀌어 필터와 화면 상품이 어긋나는 시간차를 만들지 않기 위해서다.
- 외부 Route Handler는 새로 만들지 않는다. 서버 렌더 시점에 service를 직접 호출한다.
- 외부 응답 필드명과 DB 필드명은 모두 camelCase `category`, `subCategory`로 일치한다.

문자열 배열만 반환하지 않고 pair를 반환하는 이유는 소속 카테고리를 보존하기 위해서다. 향후 서로 다른 카테고리에 같은 서브카테고리 키가 생겨도 홈 링크와 카테고리별 필터가 모호해지지 않는다.

### 4.2 DB 파이프라인

중복 제거는 애플리케이션으로 상품 전건을 가져오지 않고 DB에서 수행한다.

```ts
const match = category
  ? { deletedAt: null, status: "active", category }
  : { deletedAt: null, status: "active" };

const rows = await ProductModel.aggregate<{
  _id: { category: string; subCategory: string };
}>([
  { $match: match },
  {
    $group: {
      _id: { category: "$category", subCategory: "$subCategory" },
    },
  },
]);
```

`$group` 결과 순서는 계약으로 사용하지 않는다. DB에는 순서의 원본이 없고 요구사항의 순서는 코드 정의가 소유하기 때문이다.

### 4.3 교집합과 정렬

집계 결과를 pair Set으로 만든 뒤, DB 결과를 정렬하는 대신 코드 원본을 순회한다.

```ts
const availablePairs = new Set(
  rows.map(({ _id }) => `${_id.category}\u0000${_id.subCategory}`),
);

const categories = category ? [category] : PRODUCT_CATEGORIES;

return categories.flatMap((currentCategory) =>
  SUB_CATEGORY_MAP[currentCategory]
    .filter((subCategory) =>
      availablePairs.has(`${currentCategory}\u0000${subCategory}`),
    )
    .map((subCategory) => ({ category: currentCategory, subCategory })),
);
```

이 순서로 다음 요구를 동시에 만족한다.

1. 같은 pair의 상품이 여러 개여도 `$group`으로 한 번만 반환한다.
2. DB에 남은 미지 category/subCategory는 코드 원본을 순회할 때 제외한다.
3. 유효한 서브카테고리 키라도 다른 카테고리에 잘못 연결된 문서는 pair 비교에서 제외한다.
4. 공개 상품이 없는 분류는 Set에 없으므로 제외한다.
5. 최종 순서는 `PRODUCT_CATEGORIES`와 각 `SUB_CATEGORY_MAP[category]`의 정의 순서다.

DB raw row는 신뢰되지 않은 문자열이다. 교집합 전에 `as ProductCategory`/`as SubCategory`로 캐스팅하지 않고, 교집합을 통과해 코드 원본에서 나온 값만 타입이 지정된 반환값에 넣는다.

## 5. 인덱스 결정

### 5.1 이번 변경에서는 추가하지 않는다

현재 Product 스키마에는 MongoDB 기본 `_id` 외 커스텀 인덱스가 없다. 이번 기능만을 근거로 `status`, `deletedAt`, `category`, `subCategory` 복합 인덱스를 추가하지 않는다.

근거는 다음과 같다.

- `status`와 `deletedAt`은 공개 상품에서 같은 값에 몰릴 가능성이 큰 저선택도 필드다. 데이터 분포와 실행 계획 없이 일반 복합 인덱스를 추가하면 많은 문서를 읽는 비용은 그대로인데 쓰기·저장 비용만 늘 수 있다.
- 가용 분류 집계는 상품 본문을 반환하지 않고 유일한 pair만 계산한다. 현재 taxonomy는 5개 category, 21개 subCategory로 결과 cardinality가 작다.
- 공개 상품 목록은 `isFeatured`, `priority`, `createdAt`으로 정렬하지만 가용 분류 집계는 `category`, `subCategory`로 그룹화한다. 두 조회를 억지로 한 인덱스에 모두 맞추면 어느 쪽에도 명확한 정렬 이점을 주지 못한다.
- 요구사항과 저장소에는 상품 수, 호출량, p95 지연, `explain("executionStats")` 결과가 없다. 측정 근거 없이 미래 규모를 가정한 인덱스는 추가하지 않는다.

### 5.2 향후 재검토 기준

운영에서 홈/카테고리 SSR의 지연이 문제가 되면 먼저 다음을 측정한다.

```js
db.products.explain("executionStats").aggregate([
  { $match: { deletedAt: null, status: "active" } },
  { $group: { _id: { category: "$category", subCategory: "$subCategory" } } },
]);
```

`totalDocsExamined`, `totalKeysExamined`, 실행 시간, 공개 문서 비율을 확인한 뒤에만 공개 문서용 partial index를 후보로 검토한다.

```js
db.products.createIndex(
  { category: 1, subCategory: 1 },
  {
    name: "public_category_subcategory",
    partialFilterExpression: {
      deletedAt: null,
      status: "active",
    },
  },
);
```

이는 **현재 적용안이 아니다.** 실제 실행 계획에서 집계 읽기량을 줄이는 것이 확인될 때 별도 변경으로 도입한다. 공개 목록 정렬 인덱스가 필요하면 그 조회의 실행 계획을 별도로 측정하며, 이 집계 인덱스에 정렬 필드를 추측으로 덧붙이지 않는다.

## 6. 마이그레이션과 배포

스키마 필드, enum, default, validator, 인덱스를 바꾸지 않으므로 다음 작업은 모두 불필요하다.

- 기존 Product 문서 backfill 스크립트
- 컬렉션 변환 또는 재작성
- `syncIndexes()`/수동 `createIndex()` 실행
- 배포 전후 dual-read/dual-write
- 롤백용 데이터 스크립트

배포는 조회 코드 변경만 포함한다. 롤백해도 저장 데이터 shape에는 변화가 없다.

레거시 분류를 삭제하거나 덮어쓰는 데이터 정리도 이번 범위가 아니다. 레거시 값은 관리자 화면의 전체 상태 관리 계약을 위해 보존하고, 공개 가용 분류 계산에서만 안전하게 제외한다.

## 7. 검증 체크리스트

- [ ] 공개 목록/API/검색/인기/가용 분류가 모두 `{ deletedAt: null, status: "active" }`를 사용한다.
- [ ] 관리자 일반 목록은 inactive/soldOut를 계속 반환하고, 휴지통 조회도 유지한다.
- [ ] 동일 category/subCategory의 active 상품 여러 개가 있어도 pair는 한 번만 반환한다.
- [ ] inactive, soldOut, soft-deleted 상품만 있는 서브카테고리는 반환하지 않는다.
- [ ] 레거시 category/subCategory와 잘못 연결된 pair는 반환하지 않는다.
- [ ] 결과 순서는 DB 순서가 아니라 `PRODUCT_CATEGORIES`/`SUB_CATEGORY_MAP` 정의 순서다.
- [ ] `category` 인자 사용 시 다른 카테고리의 pair가 반환되지 않는다.
- [ ] 상품 목록 페이지는 공개 상품과 가용 분류를 별도 DB 조회하지 않고 동일 공개 상품 결과에서 파생한다.
- [ ] `src/models/product.model.ts` 및 데이터/인덱스 마이그레이션 파일에 변경이 없다.

## 8. 협의 결과

- api-designer(`/root/api_design`)와 `getAvailableSubCategoriesService(category?)` 및 `Array<{ category, subCategory }>` 반환 shape를 확정했다.
- 공개 predicate, 코드 정의와의 교집합, 중복·레거시 제거, 신규 외부 API를 만들지 않는 경계에 합의했다.
- 상품 목록 페이지는 공개 상품 결과에서 가용 분류를 파생하고, DB 집계 서비스는 홈을 주 소비처로 삼는 경계에 합의했다.
- DB 필드와 서비스 반환 필드 사이 이름 불일치는 없다.
- 미해결 쟁점은 없다.
