## §1 요약

| 지표 | 수치 |
|---|---:|
| 조사 파일 | 613 |
| 판정 대상 `.ts`/`.tsx` | 574 (비테스트 441 + 테스트 133) |
| 위반 파일 | 37 |
| 준수 파일 | 537 |
| 준수율 | 93.6% |

| 축 | High | Medium | Low | 합계 |
|---|---:|---:|---:|---:|
| 축 1 — 역할 배치 | 0 | 19 | 16 | 35 |
| 축 2 — 파일 위치·명명 | 0 | 0 | 11 | 11 |
| 축 3 — 의존 방향 | 0 | 0 | 0 | 0 |
## §2 위반 목록

### 축 1 — 역할 배치

- `src/app/api/banks/route.ts:7`, `src/app/api/kakaomap/route.ts:17`, `src/app/api/subway/[station]/route.ts:4`, `src/app/api/upload/signature/route.ts:6`, `src/app/api/webhooks/portone/route.ts:1` — [축1/Medium] Route Handler 5개가 외부 API·SDK 호출 또는 Adapter 조합 유스케이스를 직접 소유
  근거: ADR-0001 §결정
  조치: 분할

- `src/app/api/order/create/route.ts:28` — [축1/Medium] 브라우저 트리거 주문 생성 mutation을 POST Route Handler로 배치
  근거: data-access.md §데이터 접근 경로 — 무엇이 필요한가가 기준
  조치: 이동 → `src/actions/createOrder.ts`

- `src/app/(admin)/admin/products/_components/ProductEditDialog.tsx:4`, `src/app/(admin)/admin/products/_components/ProductTableRowAction.tsx:2`, `src/app/(admin)/admin/products/_components/ProductTableRowSelect.tsx:5`, `src/app/(admin)/admin/reviews/_components/AdminReviewsTemplate.tsx:3`, `src/app/(main)/(my-order)/my-orders/[orderId]/invitation/_components/InvitationStatusControls.tsx:3`, `src/app/(main)/(my-order)/my-orders/_components/OrderCard.tsx:3`, `src/app/(main)/(my-order)/my-orders/_components/OrderList.tsx:4`, `src/app/(main)/(my-order)/my-orders/_components/PaymentButton.tsx:12`, `src/app/(main)/(my-order)/my-orders/_components/ReviewFormDialog.tsx:3`, `src/app/(main)/(products)/products/[category]/[id]/_components/ProductLikeBadge.tsx:3`, `src/app/(main)/(products)/products/[category]/[id]/_components/ProductViewTracker.tsx:3`, `src/app/(main)/payment-result/_components/PaymentResult.tsx:3`, `src/app/(preview)/preview/[publicKey]/_components/LiveGuestbookSection.tsx:3` — [축1/Medium] `_components` 13개가 SWR 또는 Server Action 결합과 도메인 side effect를 소유
  근거: src/app/AGENTS.md §Structure
  조치: 이동 → 각 라우트의 동급 `_containers/{동일파일명}`

- `src/adapters/browser/cloudinary/widget.tsx:1`, `src/adapters/server/cloudinary/publicId.ts:1` — [축1/Low] 런타임 세그먼트의 제품 모듈 2개에 각각 `client-only`·`server-only` marker가 없음
  근거: ADR-0002 §결정
  조치: 유지

- `src/services/product.ts:24`, `src/services/premiumFeature.ts:7`, `src/app/(main)/(products)/products/[category]/[id]/_components/ProductDetailTemplate.tsx:1`, `src/app/(admin)/admin/premium-features/_components/PremiumFeatureCardAction.tsx:6`, `src/app/(admin)/admin/products/new/_containers/ProductRegistrationForm.tsx:9`, `src/app/(main)/(products)/products/[category]/[id]/_containers/ProductSummary.tsx:7`, `src/app/(admin)/admin/premium-features/_containers/PremiumFeatureDialog.tsx:6`, `src/app/(admin)/admin/products/_components/ProductTableRowSelect.tsx:8`, `src/app/(main)/(products)/products/[category]/_containers/ProductCatalog.tsx:6`, `src/app/(admin)/admin/products/_components/ProductEditDialog.tsx:6`, `src/app/(main)/page.tsx:4`, `src/app/(admin)/admin/products/_components/ProductTableRow.tsx:5`, `src/app/(main)/_components/HomeTemplate.tsx:1`, `src/app/(main)/_components/PopularProductsSection.tsx:7` — [축1/Low] core 도메인 타입을 services 2개가 소유·재노출하고 route-local UI 등 12개가 그 경로를 소비
  근거: ADR-0001 §결정
  조치: 이동 → `src/core/domain/product.ts`, `src/core/domain/premium-feature.ts`

### 축 2 — 파일 위치·명명

- `src/app/api/order/route.ts:19`, `src/app/api/order/create/route.ts:28` — [축2/Low] 주문 컬렉션 API가 단수 `order`를 쓰고 행위 세그먼트 `create`를 별도 노출
  근거: route-naming.md §규칙 4가지
  조치: 리네임 → `src/app/api/orders/route.ts`

- `src/services/payment.ts:4`, `src/services/product.ts:2`, `src/app/(main)/(products)/products/[category]/[id]/_components/ProductDetailTemplate.tsx:2`, `src/app/(admin)/admin/premium-features/_components/PremiumFeatureCardAction.tsx:6`, `src/app/(admin)/admin/products/new/_containers/ProductRegistrationForm.tsx:9`, `src/app/(main)/(products)/products/[category]/[id]/_containers/ProductSummary.tsx:8`, `src/app/(admin)/admin/premium-features/_containers/PremiumFeatureDialog.tsx:6`, `src/app/(preview)/_components/GuestbookModal.tsx:3`, `src/app/(admin)/admin/_components/AdminModal.tsx:4` — [축2/Low] 9개 파일이 심볼 정의 파일 대신 models·services·store facade의 재수출 경로를 import
  근거: ADR-0004 §결정
  조치: 유지

### 축 3 — 의존 방향

위반 없음 (확인 파일 574개)

## §3 심각도 집계

| 심각도 | 건수 | 이동 | 리네임 | 분할 | 유지 |
|---|---:|---:|---:|---:|---:|
| High | 0 | 0 | 0 | 0 | 0 |
| Medium | 19 | 14 | 0 | 5 | 0 |
| Low | 27 | 14 | 2 | 0 | 11 |
| 합계 | 46 | 28 | 2 | 5 | 11 |

## §4 회색지대 질문

Q1. route-local 순수 함수는 재사용 건수만으로 `_utils` 잔류 여부를 정할 것인가?
  현황: `_utils` 제품 파일 11개는 모두 순수하며 10개는 단일 소비자, 1개는 같은 라우트 하위 소비자 3개가 사용
  선택지: A) 라우트 종속이면 `_utils` 유지 B) 순수 계산이면 `core/utils` 승격
  영향: A) 이동 0개 B) 이동 11개

Q2. `ui/hooks` 승격 임계점은 현재 소비 범위인가, 잠재 재사용성인가?
  현황: 훅 23개 중 14개는 직접 app 소비자가 한 라우트 하위에만 있고 3개는 그 훅들의 내부 지원용이며 6개는 복수 소비자·공용 UI가 사용
  선택지: A) 단일 라우트 종속 17개를 route-local `_hooks`로 이동 B) 의미상 재사용 가능한 훅은 `ui/hooks` 유지
  영향: A) 이동 17개 B) 이동 0개

Q3. `adapters/browser`가 감싸야 할 브라우저 API 경계를 어디까지 볼 것인가?
  현황: app·ui 제품 모듈 13개가 `window`·`document`·`navigator`·`sessionStorage`·`crypto`를 직접 사용
  선택지: A) 브라우저 전역 접근을 전부 Adapter화 B) 독립 capability wrapper인 복사·위치 조회만 Adapter화
  영향: A) 13개 분할·이동 B) 2개 분할·이동

Q4. Route Handler와 Server Action이 함께 쓰는 오류 변환 경계는 어느 역할이 소유해야 하는가?
  현황: `src/boundary.ts` 1개가 `NextResponse` 변환과 Action 반환 오류 변환을 함께 소유
  선택지: A) 프레임워크 Adapter와 Action 경계로 분할 B) `src/` 루트 예외로 명문화
  영향: A) 1개 분할 B) 이동 0개

Q5. `_components`의 view와 도메인 side effect가 한 파일에 섞였을 때 파일 전체를 옮길 것인가?
  현황: 위반 13개 모두 렌더링과 SWR·Server Action 흐름을 한 파일에서 함께 수행
  선택지: A) 파일 전체를 `_containers`로 이동 B) 순수 view를 `_components`에 남기고 container를 신설
  영향: A) 13개 이동 B) 최대 13개 container 신설·기존 파일 분할

Q6. `kakaomap`은 어휘화된 단일어인가, `kakao-map`으로 분리할 합성어인가?
  현황: `src/app/api/kakaomap/route.ts` 1개만 무하이픈 합성 세그먼트를 사용
  선택지: A) `kakaomap` 유지 B) `kakao-map`으로 리네임
  영향: A) 이동 0개 B) 라우트 1개와 소비 경로 변경

## §5 문서 갭

- 없음
