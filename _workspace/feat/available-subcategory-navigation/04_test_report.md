# 테스트 리포트

## 추가·보강한 시나리오

- 공개 상품 조회가 active + 미삭제 상품만 반환한다.
- 관리자 전체 조회는 inactive/soldOut 상품을 계속 반환한다.
- 공개 검색과 인기 상품에서 비공개 상품을 제외한다.
- 가용 서브카테고리 집계가 중복·레거시·잘못 연결된 pair를 제외하고 코드 정의 순서를 유지한다.
- `/api/products`가 공개 상품 배열 envelope을 유지한다.
- 홈 RSC가 가용 pair를 Template까지 전달하고 조회 실패 시 빈 배열로 축약한다.
- 홈 탐색은 전달된 pair만 라벨 Link로 렌더하고 0건이면 섹션을 숨긴다.
- 상품 필터는 현재 공개 상품에 존재하는 서브카테고리만 표시한다.
- 딥링크 query가 현재 category의 가용 목록에 없으면 `all`로 폴백한다.

## 실행 결과

| 명령/범위 | 결과 |
| --- | --- |
| 관련 unit | 1 file, 28 tests PASS |
| 관련 component | 4 files, 23 tests PASS |
| 관련 integration | 3 files, 81 tests PASS |
| `npm run lint` | PASS |
| `npm run tsc` | PASS |
| production build | PASS |
| 전체 Vitest | 135 files/818 tests PASS, 2 files/2 tests FAIL |

## 기존 비관련 실패

1. `src/adapters/browser/cloudinary/widget.test.ts`: 테스트는 `cropping:true`, `multiple:false`를 기대하지만 현행 구현은 `cropping:false`, `multiple:true`다.
2. `src/app/(preview)/preview/[publicKey]/_utils/invitationMessage.mapper.test.ts`: 테스트 기대 배열에는 `신랑`이 없지만 현행 매퍼 결과에는 포함된다.

두 파일은 이번 브랜치에서 변경하지 않았고 이전 작업 기록에서도 같은 실패가 확인됐다. 기능 관련 검증과 빌드는 통과했다.
