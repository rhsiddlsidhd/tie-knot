# 디렉터리 감사 후속 계획

> 선행 문서: `report.md`(사실 판정), `plan.md`(결정·실행)
> 작성일: 2026-09-03

## 0. 이 문서의 위치

`plan.md`의 Step 1~6이 모두 머지됐다. 이 문서는 그 실행 과정에서 **범위 밖으로 밀어낸 것들**을 모아 순서를 세운다. 감사 보고서에서 파생됐지만 각각 독립된 판단이 필요해 별도 Issue로 등록한 항목들이다.

실행 결과 요약:

| PR | 내용 | 머지 |
|---|---|---|
| #233 | 회색지대 4건을 규칙 문서에 반영 + 감사 산출물 기록 | `1ead3a6` |
| #235 | `_components` 13개 → `_containers` (+ `AdminReviewsTemplate` → `AdminReviewsTable`) | `53a29e2` |
| #236 | 주문 API 복수형 리네임 + dead route 삭제 | `a25a686` |
| #237 | `_components`의 Server Action import 금지 lint 규칙 | `0486c4b` |
| #240 | cloudinary runtime marker 복구 | `821fde5` |
| #241 | 도메인 타입을 재수출 대신 core에서 직접 import | `6f53eaf` |
| #242 | clipboard·geolocation을 browser adapter로 | `69d0309` |
| #243 | subway·upload 유스케이스를 services로 | `9722ed6` |
| #244 | PortOne 은행 목록을 server adapter로 | `dcafcc5` |
| #245 | 카카오 지오코딩 계약을 server adapter로 + `kakao-map` 리네임 | `12bc744` |

---

## 1. 대상 Issue

| Issue | 제목 | 크기 | 선행 판단 |
|---|---|---|---|
| #246 | `kakao-map` 라우트가 `address` 없는 요청을 상류로 넘긴다 | 작음 | zod vs 단순 guard |
| #83 | 동작하지 않는 주문 생성 라우트 제거 — `DISABLED` 잔여분만 남음 | 작음 | 분류를 남길지 말지 |
| #239 | 클라이언트 `crypto.randomUUID` 2건의 처리 방향 | 작음 | Adapter화 vs 비결정성 제거 |
| #238 | 되돌릴 수 없는 동작의 확인창을 프로젝트 다이얼로그로 | **큼** | 공용 확인 다이얼로그 형태 |

---

## 2. 실행 순서

### 1순위 — #246 (`kakao-map` 입력 검증)

**왜 먼저인가**: 오분류를 고치는 건이라 사용자에게 보이는 개선이 있고, 방금 그 파일을 만진 맥락이 살아 있다.

`searchParams.get("address")`가 `null`이면 빈 문자열이 그대로 카카오로 나간다. 지금은 카카오가 `InvalidArgumentError`를 돌려주는 데 기대므로, **우리 입력 오류가 외부 서비스 장애(502)로 분류돼 나간다**. `docs/architecture/error-handling.md`의 분류 규칙과 어긋나고, 막을 수 있는 요청에 외부 API 호출을 소비한다.

- 결정: 파라미터가 하나뿐이라 zod + `validateAndFlatten`이 과한지 판단한다. 다른 라우트 관행은 zod다.
- 따라오는 수정: `route.unit.test.ts`의 "ok:false → 502" 케이스가 빈 주소로 요청한다. 그 테스트 의도는 "상류 에러 본문 → 502"이므로 입력만 비어 있지 않은 주소로 바꾼다.

### 2순위 — #83 잔여분 (`DISABLED` 분류)

**왜 여기인가**: 라우트 삭제는 #236에서 끝났고, 판단 하나만 남아 5분이면 닫힌다. 미결 이슈를 오래 열어둘 이유가 없다.

`DISABLED`는 현재 `core/domain/error.ts:28`의 taxonomy와 `boundary.ts:18`의 503 매핑에만 있고 throw하는 곳이 없다.

- 남긴다면: 점검 모드·기능 플래그용으로 예약된 분류임을 `error-handling.md`에 한 줄로 남기고 이슈를 닫는다.
- 제거한다면: union에서 빼면서 `ERROR_STATUS_MAP`과 `ERROR_SAFE_MESSAGES`를 함께 정리한다.

빈 분류를 근거 없이 남겨두면 다음 감사가 같은 질문을 다시 한다 — 어느 쪽이든 **문서에 근거를 남기는 것**이 이 작업의 핵심이다.

### 3순위 — #239 (`crypto.randomUUID` 2건)

**왜 여기인가**: 조사 결과 선택지가 좁혀져 실행이 짧아졌다. 다만 새 기준의 해석이 걸려 있어 #246·#83보다 뒤에 둔다.

두 값 모두 **id가 클라이언트를 벗어나지 않는다**:

- `ui/hooks/useImageList.ts:8` — 서버로 나가는 건 `getUrls()`의 url 배열뿐이고, id는 렌더 key와 `remove(id)` 대조용이다.
- `ui/context/guestbookDemo/reducer.ts:42` — 미리보기 데모 컨텍스트다. `demo-1`/`demo-2` 시드를 로컬 상태로만 다루고 영속화 경로가 없다.

따라서 원래 이슈에 적었던 "생성 위치를 서버로 이동"은 옮길 대상이 없어 성립하지 않는다. 남은 선택지:

- **A) `adapters/browser/crypto/` 신설** — `adapters/AGENTS.md §경계`의 "비결정적" 항목에 문자 그대로 부합한다.
- **C) 비결정성을 없앤다** — 전역 고유성이 필요 없는 렌더 key에 UUID는 과하다. 카운터나 `useId`로 바꾸면 감쌀 대상 자체가 사라진다.

C를 고른다면 새 기준과 어긋나 보이지 않도록 근거를 남겨야 한다: 기준은 "비결정성을 감싸라"가 아니라 **"필요 없는 비결정성은 만들지 마라"가 먼저**다. Adapter는 없앨 수 없는 비결정성(권한 게이트, 외부 SDK)을 위한 장치다.

확인할 것: `useImageList`는 `add()`로 항목이 나중에 추가되므로 카운터를 훅 상태로 들고 있어야 한다.

### 4순위 — #238 (확인 다이얼로그)

**왜 마지막인가**: 넷 중 유일하게 공용 컴포넌트 설계가 선행되고, 파괴적 동작 6곳의 인터랙션과 테스트를 함께 바꾼다.

**범위가 정정됐다 — 3곳이 아니라 4파일 6곳이다.**

| 파일 | 위치 | 동작 |
|---|---|---|
| `admin/products/_containers/ProductTableRowAction.tsx` | 21 | 상품 삭제 |
| 〃 | 45 | 상품 복구 |
| 〃 | 70 | **영구 삭제** |
| `admin/reviews/_containers/AdminReviewsTable.tsx` | 28 | 리뷰 삭제 |
| `my-orders/_containers/OrderCard.tsx` | 75 | 주문 취소 |
| `my-orders/_containers/ReviewFormDialog.tsx` | 70 | 리뷰 삭제 |

`ProductTableRowAction.tsx`는 `window.` 접두사 없이 전역 `confirm(...)`을 부른다. 감사가 `\b(window|document|navigator|...)\.` 패턴으로 브라우저 전역 사용을 찾았기 때문에 이 3곳이 통째로 누락됐다 — 방법론의 사각지대다(§3 참고).

누락된 3곳 중 하나가 **영구 삭제**라, 가장 되돌릴 수 없는 동작이 브라우저 기본 confirm으로 처리되고 있었다.

**선행 결정**: `ui/components/atoms/dialog.tsx`(Radix)는 있지만 `alert-dialog`는 없다. 셋 중 하나를 고른다.

1. Radix AlertDialog를 도입해 atom 추가
2. 기존 `dialog.tsx` 위에 molecule로 조립
3. 훅(`useConfirm`) — 호출부 모양이 `confirm()`과 가장 가깝다

**따라오는 테스트**: `vi.spyOn(window, "confirm")`으로 확인창을 통과시키는 테스트 3개(`ProductTableRowAction.component.test.tsx:77`, `AdminReviewsTable.component.test.tsx:60,75`, `ReviewFormDialog.component.test.tsx:90`)가 실제 다이얼로그를 열고 버튼을 누르는 방식으로 바뀐다.

---

## 3. 감사 방법론에 남길 교훈

이번 실행에서 보고서 판정이 **네 번** 어긋났다. 다음 감사를 설계할 때 쓸 자료다.

| # | 보고서 판정 | 실제 | 원인 |
|---|---|---|---|
| 1 | `webhooks/portone`이 유스케이스를 소유 | 서명 검증은 진입점 고유 책임 | 위반 판정이 과함 |
| 2 | services 2개가 도메인 타입을 **소유**·재노출 | 타입은 이미 `core/domain`에 있었고 재수출뿐 | 정의 위치를 안 따라감 |
| 3 | `api/order/create` 배치 위반 → Action 이전 | 이전은 이미 끝났고 라우트만 잔재 | 호출자를 안 세어봄 |
| 4 | 브라우저 전역 직접 사용 13건 | 12건(오탐 1) + 누락 3건 | 정규식이 접두사 없는 전역 호출을 못 잡음 |

공통점: **grep 패턴과 파일 위치로 판정하고 호출 그래프를 따라가지 않았다.** 2·3은 "누가 이 심볼을 정의하는가 / 누가 이 파일을 부르는가"를 한 번만 확인했으면 안 나왔을 판정이다.

또 하나 — 축1(역할 배치) 14건과 축2(재수출 경로) 9건이 상당 부분 같은 현상을 두 축에 나눠 담은 결과였다. 축별 집계 전에 중복을 제거해야 부채 규모가 실제와 맞는다.
