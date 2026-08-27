# 통합 리포트

## 결과

`feat/available-subcategory-navigation`의 REQ-1~REQ-4를 모두 충족했다.

- 관리자용 전체 상품 조회와 사용자용 공개 상품 조회를 분리했다.
- 공개 상품 조건을 `deletedAt: null && status: "active"`로 통일했다.
- 홈은 공개 상품이 있는 유효한 category/subCategory pair만 코드 정의 순서로 표시한다.
- 홈 탐색 항목에서 아이콘과 원형 배경을 제거하고 라벨 Link만 유지했다.
- 상품 필터는 현재 공개 상품과 `SUB_CATEGORY_MAP`의 교집합만 표시한다.
- 다른 카테고리 소속·상품 없음·레거시·배열 query는 최초 렌더에서 `all`로 폴백한다.
- Product 모델, 인덱스, 데이터 마이그레이션은 변경하지 않았다.

## 구현 커밋

- `7620424 feat: separate public product discovery`
- `cffc7ab feat: derive available subcategory navigation`

## 경계 검증

- `GET /api/products` ↔ `fetcher`/`useProducts`: PASS
- `getAvailableSubCategoriesService` ↔ 홈 pair 계약: PASS
- 홈 RSC ↔ 홈 탐색 UI, 상품 RSC ↔ 필터/딥링크: PASS
- REDO: 0
- `MANUAL_INTERVENTION_REQUIRED`: 없음

초기 API 계약과 UI 계약 사이에 SWR 이후 선택값 자동 보정 범위가 한 줄 상충했다. 사용자가 승인한 기존 계획과 kickoff 지시를 기준으로 자동 보정은 비범위로 확정했고 API 계약 문구를 수정했다. 제품 코드 재작업은 필요하지 않았다.

## 검증 요약

- `npm run lint`: PASS
- `npm run tsc`: PASS
- 관련 unit: 28 PASS
- 관련 component: 23 PASS
- 관련 MongoDB integration: 81 PASS
- 프로덕션 `next build`: PASS
- 전체 Vitest: 818 PASS, 기존 비관련 실패 2

전체 회귀 실패 2건은 이 브랜치가 수정하지 않은 Cloudinary widget 옵션 기대값과 invitation message 관계 배열 기대값이다. 두 실패는 이전 중단 세션에서도 동일하게 재현됐으며 이번 diff와 경로상 연결되지 않는다.

## 요구사항 판정

| 요구사항 | 결과 | 근거 |
| --- | --- | --- |
| REQ-1 | PASS | 공개 service/API predicate와 관리자 service 분리, 통합 테스트 |
| REQ-2 | PASS | pair 집계·교집합·순서·빈 섹션 테스트 |
| REQ-3 | PASS | 아이콘 파일 삭제와 라벨 Link 컴포넌트 테스트 |
| REQ-4 | PASS | 현재 상품 기반 필터 및 route-local query 폴백 테스트 |
