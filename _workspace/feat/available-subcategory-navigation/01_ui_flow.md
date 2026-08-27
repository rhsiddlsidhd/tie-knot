# 01_ui_flow — 공개 상품 기반 서브카테고리 탐색 UI

> 브랜치: `feat/available-subcategory-navigation`
> 담당: ui-designer
> 대상: REQ-2, REQ-3, REQ-4 (REQ-1의 공개 조회 정책을 화면 입력으로 소비)
> API/DB 협의: `/root/api_design`, `/root/db_design`과 1라운드 합의 — 상세 서버 함수명과 응답 계약은 `01_api_contract.md`, 집계 계약은 `01_db_schema.md`가 원본이다.

## 0. 설계 결론

- 홈은 공개 상품(`status: "active"`, `deletedAt: null`)이 하나 이상 있는 유효한 서브카테고리만, `PRODUCT_CATEGORIES` → `SUB_CATEGORY_MAP` 순서로 보여준다.
- 홈 탐색 항목은 기존 `Link`·Embla 캐러셀·휠/드래그·키보드 탐색을 유지하고 아이콘과 원형 배경만 제거한다. 새 컴포넌트를 만들지 않는다.
- `/products/[category]`는 공개 상품만 화면에 전달한다. 필터 버튼도 현재 렌더 중인 공개 상품 데이터와 해당 카테고리의 `SUB_CATEGORY_MAP` 교집합만 보여준다.
- `?subCategory=`는 해당 카테고리의 현재 available 목록에 포함될 때만 초기 선택한다. 다른 카테고리 소속, 상품 없음, 레거시/오타, 빈 값, 중복 파라미터는 모두 `all`로 폴백하며 URL은 리다이렉트하지 않는다.
- 홈 available 조회 실패와 실제 available 0건은 모두 탐색 섹션 미렌더로 축약한다. 상품 목록 조회 실패는 기존 `(products)/error.tsx`가 처리한다.

## 1. 화면 플로우

### 1.1 전체 흐름

```text
[홈 / 진입]
  └─ RSC: 공개 상품이 있는 유효 서브카테고리 조회
       ├─ 1개 이상
       │   └─ "카테고리 둘러보기" 캐러셀
       │       └─ 라벨 Link 선택
       │           └─ /products/{category}?subCategory={subCategory}
       └─ 0개 또는 조회 실패
           └─ 탐색 섹션 전체 미렌더

[/products/{category} 직접 진입 또는 홈 Link 도착]
  ├─ category 경로값 무효 → 기존 notFound()
  └─ category 유효
      ├─ RSC: 공개 상품 조회 → 같은 배열에서 available 서브카테고리 파생
      │   └─ 조회 실패 → 기존 (products)/error.tsx
      ├─ query가 이 category의 available 목록에 포함
      │   └─ 해당 필터 active, 공개 상품 중 해당 분류만 표시
      └─ query 없음/무효/타 category/상품 없음/반복값
          └─ "전체" active, 공개 상품 전체 표시
```

### 1.2 실제 도달 URL

라우트 그룹 `(main)`, `(products)`는 URL에서 제거된다.

| 화면 | 파일 | 실제 URL |
| --- | --- | --- |
| 홈 | `src/app/(main)/page.tsx` | `/` |
| 카테고리 상품 목록 | `src/app/(main)/(products)/products/[category]/page.tsx` | `/products/{category}` |
| 서브카테고리 딥링크 | 같은 파일 | `/products/{category}?subCategory={subCategory}` |
| 상품 상세 | `.../[category]/[id]/page.tsx` | `/products/{category}/{id}` |

`routes.products.byCategory(category, subCategory)`를 그대로 사용한다. 쿼리 문자열을 UI에서 따로 조립하거나 서브카테고리 key를 slug 변환하지 않는다.

## 2. 화면 계약

### 2.1 홈 탐색 섹션

| 항목 | 계약 |
| --- | --- |
| 제목 | 기존 `카테고리 둘러보기` 유지 |
| 목록 데이터 | `Array<{ category: ProductCategory; subCategory: SubCategory }>` (`getAvailableSubCategoriesService()` 결과) |
| 노출 기준 | 공개 상품이 1개 이상 있고, 해당 쌍이 `SUB_CATEGORY_MAP[category]`에 존재할 때만 |
| 순서 | `PRODUCT_CATEGORIES` 순서, 각 카테고리 안에서는 `SUB_CATEGORY_MAP[category]` 순서 |
| 중복 | 동일 `{category, subCategory}`는 한 번만 표시 |
| 아이템 시각 | `subCategoryLabels[subCategory]`의 타이포그래피 라벨만 표시 |
| 제거 | Lucide 아이콘, 원형 `bg-muted` 배경, `subCategoryIcons` 매핑과 배럴 export |
| 유지 | `<Link>`, 캐러셀 region/aria-label, 가로 드래그·휠 이동, 데스크톱 이전/다음 버튼, 포커스 가능한 링크 |
| 0건/실패 | 제목과 빈 캐러셀을 남기지 않고 `SubCategoryNavSection` 전체 미렌더 |

라벨만 남더라도 링크의 최소 터치 영역은 기존 `min-h-11 min-w-11` 이상을 유지한다. 텍스트가 긴 항목은 줄바꿈으로 높이가 흔들리지 않도록 `whitespace-nowrap`을 사용하며, 캐러셀 아이템의 `basis-auto`는 유지한다. 별도의 pill, 카드, 카테고리 제목을 새로 추가하지 않는다.

접근성 이름은 아이콘 제거 후에도 라벨 텍스트 자체가 제공한다. `aria-label`을 중복 추가하지 않는다. 기존 캐러셀의 `aria-label="서브카테고리 바로가기"`와 키보드 포커스 이동 계약을 유지한다.

### 2.2 상품 필터

필터 칩은 전체 taxonomy가 아니라 **현재 렌더 중인 공개 상품 데이터**에서 파생한다.

```text
후보 = SUB_CATEGORY_MAP[category]
노출 = 후보 중 products.some(product => product.subCategory === 후보)
최종 옵션 = ["all", ...노출]
```

이 순서로 계산하면 다음이 동시에 보장된다.

- DB 결과 순서와 무관하게 코드 정의 순서가 유지된다.
- 다른 카테고리의 서브카테고리와 레거시 문자열은 후보 단계에서 제외된다.
- 중복 상품이 여러 개여도 필터 버튼은 하나다.
- inactive/soft-deleted 상품은 공개 상품 배열에 들어오지 않으므로 버튼을 만들지 못한다.
- 상품 0건이면 `전체` 버튼만 남고 기존 `ProductGrid`의 “상품을 준비 중에 있습니다” 빈 상태를 사용한다.

별도 필터 UI나 새 organism은 만들지 않는다. 기존 `ProductFilters`의 서브카테고리 옵션 생성 부분만 위 파생 목록으로 제한한다. 검색, 정렬, 가격, 특별 옵션, 상세 필터의 동작은 변경하지 않는다.

### 2.3 딥링크 폴백

서버 페이지 경계에서 아래 순서로 초기값을 계산한다. 어떤 query 값도 throw하지 않는다.

| `searchParams.subCategory` | 조건 | `initialSubCategory` | 화면 |
| --- | --- | --- | --- |
| `undefined` | 파라미터 없음 | `all` | 전체 active |
| 유효 문자열 | 현재 category의 available 목록에 포함 | 해당 값 | 해당 라벨 active |
| 유효 문자열 | taxonomy에는 있으나 다른 category 소속 | `all` | 전체 active |
| 유효 문자열 | 해당 category지만 공개 상품 0건 | `all` | 전체 active |
| 레거시/오타/빈 문자열/`all` | available 목록에 없음 | `all` | 전체 active |
| `string[]` | 반복 파라미터 | `all` | 전체 active |

폴백은 선택 상태만 정규화한다. `router.replace`, redirect, canonical query 추가는 하지 않는다. 따라서 잘못된 query가 주소창에 남아도 화면은 정상적인 전체 목록이며, 새로고침해도 동일하게 `all`로 해석한다.

## 3. 컴포넌트 및 데이터 트리

```text
src/app/(main)/page.tsx                         [RSC, 수정]
├─ getFeaturedTemplatesService                  [기존]
├─ getPopularProductsService                    [기존]
├─ available-subcategory service                [신규 서버 조회, API 계약 소관]
└─ HomeTemplate                                 [기존, prop 추가]
   └─ SubCategoryNavSection                     [기존, prop 기반 렌더]
      └─ SubCategoryNavItem × N                 [기존, 라벨-only Link]
         ├─ Link                                [기존]
         └─ TypographySmall                     [기존]

src/app/(main)/(products)/products/[category]/page.tsx [RSC, 수정]
├─ 공개 product service                         [관리자 전체 조회와 분리]
├─ 같은 products에서 available 목록 파생        [query membership 확인]
└─ route-local ProductCatalog                    [기존, props 통과]
   ├─ useProducts                                [기존 GET /api/products 재검증, 무수정]
   └─ shared ProductCatalog organism             [기존]
      ├─ ProductFilterProvider                   [기존]
      ├─ ProductFilters                          [기존, data 기반 옵션 제한]
      └─ ProductGrid                             [기존]
```

### 3.1 파일별 변경 범위

| 파일 | 변경 |
| --- | --- |
| `src/app/(main)/page.tsx` | available 목록 조회, 실패 시 `[]`, `HomeTemplate`에 전달 |
| `src/app/(main)/_components/HomeTemplate.tsx` | available prop을 받아 탐색 섹션에 전달 |
| `src/app/(main)/_components/SubCategoryNavSection.tsx` | 정적 전체 taxonomy 생성 제거, available prop map, 빈 배열이면 `null` |
| `src/app/(main)/_components/SubCategoryNavItem.tsx` | 아이콘/원형 배경 제거, 라벨-only 링크 |
| `src/app/(main)/_constants/subCategoryIcons.ts` | 소비처 제거 후 삭제 |
| `src/app/(main)/_constants/index.ts` | `subCategoryIcons` export 제거; 다른 export가 없으면 빈 배럴을 남기지 않고 폴더도 제거 |
| `src/app/(main)/(products)/products/[category]/page.tsx` | 공개 조회 사용, 같은 product 배열에서 available을 파생해 query membership 검증 |
| `src/ui/components/organisms/ProductFilters.tsx` | 공개 `data`와 category map의 교집합만 필터 버튼으로 표시 |

새 컴포넌트·스토어·Context·폼 스키마는 필요 없다. 홈 전용 UI는 기존 `(main)/_components`에 그대로 두고 공용 atomic tier로 승격하지 않는다.

## 4. 데이터 및 응답 shape 매핑

### 4.1 확정 shape

| 소비처 | 성공 데이터 | UI 매핑 |
| --- | --- | --- |
| 홈 RSC | `Array<{ category, subCategory }>` | 1개 이상이면 캐러셀, `[]`이면 섹션 미렌더 |
| 상품 RSC 공개 조회 | `ProductResponse[]` | `ProductCatalog.products`; `[]`이면 기존 준비 중 empty |
| `GET /api/products?category=...` | 기존 envelope의 `data: ProductResponse[]` 유지 | 기존 `useProducts`의 현재 렌더 데이터 갱신 |

홈 available service는 쌍 배열 shape을 쓴다. DB raw aggregation 문자열은 UI로 직접 캐스팅해 넘기지 않는다. service가 유효 pair 교집합을 코드 정의 순서로 정규화한 뒤 반환한다.

상품 페이지는 available service를 별도로 병렬 호출하지 않는다. `getPublicProductsService(category)`의 한 반환 배열에서 `SUB_CATEGORY_MAP[category]` 순서로 available membership을 파생해 query 초기값과 최초 필터 칩이 동일 스냅샷을 보게 한다. UI가 별도 taxonomy를 발명하지 않으며, 표시 라벨만 `subCategoryLabels`에서 읽는다.

### 4.2 공개성 경계

화면은 `status`/`deletedAt`을 다시 해석하거나 필터링하지 않는다. 공개성 판정은 service/Route Handler의 책임이고 UI는 전달된 배열을 공개 상품의 완전한 집합으로 신뢰한다. 클라이언트에서 관리자 전체 배열을 받은 뒤 숨기는 방식은 금지한다.

## 5. 상태 머신

### 5.1 홈 탐색 상태

| 현재 상태 | 트리거 | 다음 상태 | UI |
| --- | --- | --- | --- |
| 진입 | RSC available 조회 성공, `length > 0` | `ready` | 라벨 캐러셀 렌더 |
| 진입 | RSC available 조회 성공, `length === 0` | `hidden-empty` | 섹션 미렌더 |
| 진입 | RSC available 조회 실패 | `hidden-degraded` | 실패를 `[]`로 흡수, 섹션 미렌더; 다른 홈 섹션은 계속 렌더 |
| `ready` | Link 클릭/키보드 활성화 | 목록 이동 | 해당 category/query URL |

홈은 Server Component에서 데이터를 다 받은 뒤 HTML을 보내며 현재 이 구간 전용 `loading.tsx`가 없다. 이번 기능만을 위한 skeleton/spinner를 추가하지 않는다.

### 5.2 상품 목록 초기 상태

| 현재 상태 | 트리거 | 다음 상태 | UI |
| --- | --- | --- | --- |
| 진입 | category 무효 | `not-found` | 기존 404 |
| 진입 | 공개 products 조회 실패 | `error` | 기존 `(products)/error.tsx`, 다시 시도/홈 이동 |
| 진입 | products `[]` | `empty-category` | `전체` 필터만 + 기존 준비 중 empty |
| 진입 | products 있음 + query available | `ready-filtered` | query 라벨 active + 해당 공개 상품 |
| 진입 | products 있음 + query unavailable/무효 | `ready-all` | 전체 active + 전체 공개 상품 |
| `ready-*` | 필터 버튼 선택 | `ready-filtered` 또는 `ready-all` | 기존 reducer `SELECT_SUB_CATEGORY` |
| `ready-*` | 검색/가격/옵션 때문에 결과 0 | `empty-filtered` | 기존 “조건에 맞는 상품이 없어요” + 필터 초기화 |

### 5.3 클라이언트 재검증

`useProducts`에는 서버 `fallbackData`가 있으므로 첫 렌더에 별도 로딩 상태가 없다. 브라우저 재검증 성공 시 `ProductFilters`는 갱신된 `data`에서 available 버튼을 다시 파생한다.

이번 범위는 최초 RSC 딥링크 폴백과 현재 `data` 기반 옵션 파생까지만 변경하며 `useProducts`의 기존 재검증 동작은 유지한다. 초기 RSC 실패는 반드시 전면 error boundary로 간다.

## 6. 폼 유효성

이 기능에는 입력 폼과 mutation이 없다. 신규 zod 스키마를 만들지 않는다.

`searchParams.subCategory`는 서버 페이지의 뷰 옵션이며, 검증 실패를 사용자 오류 메시지로 표시하지 않고 §2.3의 membership 검사로 `all`에 폴백한다. `category` 경로 세그먼트의 기존 `isProductCategory` + `notFound()` 계약은 유지한다.

## 7. 빈 상태와 오류 문구

| 조건 | 표시 | 신규 문구 |
| --- | --- | --- |
| 홈 available 0건 | 탐색 섹션 미렌더 | 없음 |
| 홈 available 조회 실패 | 탐색 섹션 미렌더 | 없음 |
| 상품 category 공개 상품 0건 | 기존 `ProductGrid`: “상품을 준비 중에 있습니다” | 없음 |
| 사용자 필터 조합 결과 0건 | 기존 `ProductGrid`: “조건에 맞는 상품이 없어요” + 초기화 | 없음 |
| 상품 RSC 조회 실패 | 기존 `(products)/error.tsx`: “상품 페이지 오류” | 없음 |
| 무효/이용 불가 query | 전체 필터/전체 공개 상품 | 오류 문구 없음 |

## 8. 접근성 및 회귀 방지

1. `SubCategoryNavItem`은 버튼이 아니라 목적지 URL이 있는 `<Link>`를 유지한다.
2. 캐러셀의 region 이름 `서브카테고리 바로가기`, 이전/다음 버튼, wheel/drag 옵션을 유지한다.
3. 아이콘 제거 뒤 링크의 accessible name은 정확히 `subCategoryLabels[subCategory]`다.
4. 라벨 링크의 최소 44px 터치 영역과 보이는 키보드 focus style을 기존 Link/atom 스타일에 맞춰 유지한다.
5. `first-birthday`, `ring-pillow` 같은 key는 변환 없이 href와 membership 비교에 사용한다.
6. unavailable query 폴백은 404/error boundary를 만들지 않는다.
7. 관리자 등록·수정·목록의 전체 taxonomy 옵션과 상태 표시는 이 UI 필터 변경으로 제한하지 않는다.

## 9. 구현 검증 체크리스트

- 홈 service 결과는 중복/레거시/잘못 연결된 pair/상품 없는 분류를 제외하고 코드 순서로 보인다.
- 홈 available `[]`이면 `카테고리 둘러보기` 제목과 캐러셀 region이 모두 없다.
- 홈 링크는 라벨만 보이고 아이콘 SVG와 원형 아이콘 배경이 없다.
- 홈 링크의 href, 캐러셀 drag/wheel, 이전/다음, 키보드 활성화가 유지된다.
- 상품 목록과 `GET /api/products`에는 inactive/soft-deleted 상품이 보이지 않는다.
- 상품 필터에는 `전체` + 현재 category 공개 상품이 있는 분류만 코드 순서로 보인다.
- 다른 category 분류, 상품 없는 유효 분류, 레거시/오타, 빈 값, 반복 query는 모두 첫 렌더부터 `all`이다(필터 flash 없음).
- 공개 상품이 0건이면 `전체` 버튼과 기존 category-empty UI가 함께 보인다.
- SWR 재검증 결과가 바뀌면 필터 옵션은 갱신된 공개 `data`에서 다시 파생된다.
- `subCategoryIcons` import/export/파일과 미사용 lucide 아이콘 import가 남지 않는다.

## 10. 비범위

- 필터 선택 시 URL을 양방향 동기화하는 기능
- 무효 query를 제거하기 위한 redirect/canonicalization
- 홈 탐색 실패 전용 안내문·toast·skeleton
- 공개 상품 판정을 클라이언트에서 다시 수행하는 로직
- 관리자용 전체 분류 선택 UI 축소
- 새 카테고리/서브카테고리 생성 또는 taxonomy 변경

## 11. 미해결 쟁점

현재 없음. API 응답 shape, 홈 집계 정규화, 상품 동일 스냅샷 파생, 홈 실패 축약, 상품 error boundary, query `all` 폴백, URL 비정규화에 1라운드 합의했다.
