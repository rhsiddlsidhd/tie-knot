# 디렉터리 감사 후속 계획

> 선행 문서: `report.md`(사실 판정), `plan.md`(결정·실행)
> 작성일: 2026-09-03

## 0. 이 문서의 위치

`plan.md`의 Step 1~6이 모두 머지됐다. 이 문서는 그 실행 과정에서 **범위 밖으로 밀어낸 것들**을 모아 순서를 세운다. 감사 보고서에서 파생돼 별도 Issue로 등록한 항목과, 후속 Issue를 다시 감사하면서 추가로 확인한 미등록 후보를 함께 다룬다.

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

| Issue | 제목 | 크기 | 판정 |
|---|---|---|---|
| #246 | `kakao-map` 입력 검증 + 클라이언트 URL 인코딩 | 작음 | 기존 Issue 범위 확장 |
| #249 | upload signature의 깨진 JSON이 500으로 오분류됨 | 작음 | 신규 Issue 등록 |
| #83 | 미사용 `DISABLED` 오류 분류 제거 | 작음 | 남길 근거 없음 |
| #239 | 클라이언트의 불필요한 비결정성 제거 | 작음 | 기존 Issue 범위 확장 |
| #250 | 공유 좌표 타입을 deeplink Adapter가 소유 | 작음 | 신규 Issue 등록 |
| #238 | 확인창 4파일 6곳을 프로젝트 다이얼로그로 교체 | **큼** | 기존 Issue 범위 확장 |

---

## 2. 실행 순서

### 1순위 — #246 (`kakao-map` 입력 경계 완결)

**왜 먼저인가**: 오분류를 고치는 건이라 사용자에게 보이는 개선이 있고, 방금 그 파일을 만진 맥락이 살아 있다.

`searchParams.get("address")`가 `null`이면 빈 문자열이 그대로 카카오로 나간다. 지금은 카카오가 `InvalidArgumentError`를 돌려주는 데 기대므로, **우리 입력 오류가 외부 서비스 장애(502)로 분류돼 나간다**. `docs/architecture/error-handling.md`의 분류 규칙과 어긋나고, 막을 수 있는 요청에 외부 API 호출을 소비한다.

- **추가 발견**: `useKakaomapGeocode.ts`가 `/api/kakao-map?address=${address}`를 그대로 SWR key로 쓴다. #245가 Adapter에서 상류 요청만 `encodeURIComponent`로 감쌌기 때문에, 기본 UI 소비자가 `&`나 `#`가 든 주소를 보내면 우리 Route Handler에 도착하기 전에 값이 잘린다. 상류 경계만 따라가고 그 경계의 소비자를 확인하지 않아 수정이 반쪽에 그쳤다.
- 결정: 단일 파라미터이므로 `guestbook/route.ts`의 선례처럼 단순 guard로 누락·빈 문자열·공백만 있는 값을 `AppError("VALIDATION")`으로 막는다. 검증된 값은 trim해서 Adapter에 넘긴다.
- 클라이언트: SWR key를 만들 때 주소를 `encodeURIComponent`로 감싼다.
- 따라오는 테스트:
  - Route: 누락·빈 문자열·공백은 400이고 `fetch`를 호출하지 않는다.
  - Route: 기존 "상류 ok:false → 502" 케이스는 비어 있지 않은 주소로 바꿔 원래 의도를 유지한다.
  - Hook: `&`와 `#`가 든 주소가 인코딩된 SWR key를 만드는지 확인한다.

### 2순위 — #249 (upload signature의 깨진 JSON 분류)

**왜 여기인가**: PR #243이 명시한 인증 순서 차이를 따라가다, 그보다 넓은 기존 오류 분류 결함을 확인했다. 클라이언트 입력을 서버 장애로 기록하는 문제라 #246과 같은 입력 경계 묶음으로 먼저 처리한다.

`upload/signature/route.ts`는 `request.json()`의 `SyntaxError`를 그대로 `routeError`에 넘긴다. `AppError`가 아닌 예외는 `INTERNAL`로 번역되므로, 깨진 JSON은 현재 인증 여부와 관계없이 **500**이 된다. `error-handling.md`의 `VALIDATION` 400 분류와 어긋난다.

PR #243 전후를 나누면 다음과 같다.

- 기존: 인증된 요청의 깨진 JSON은 500이었고, 미인증 요청은 JSON 파싱 전에 인증해 401이었다.
- 현재: 파싱이 인증보다 먼저라 인증 여부와 관계없이 깨진 JSON은 500이다.
- 결정: 깨진 JSON은 400, 파싱 가능한 미인증 요청은 401로 둔다. 파싱 가능한 본문에 대해서만 인증이 folder 검증보다 먼저라는 유스케이스 순서를 보장한다.

따라오는 수정:

- `request.json()` 실패를 `AppError("VALIDATION")`으로 변환한다.
- `services/upload.ts`의 "요청 본문이 어떻든 401" 주석을 실제 경계와 맞게 좁힌다.
- 깨진 JSON → 400, 정상 JSON + 미인증 → 401 테스트를 각각 고정한다.

### 3순위 — #83 잔여분 (`DISABLED` 분류)

**왜 여기인가**: 라우트 삭제는 #236에서 끝났고, 판단 하나만 남아 5분이면 닫힌다. 미결 이슈를 오래 열어둘 이유가 없다.

`DISABLED`는 현재 `core/domain/error.ts:28`의 taxonomy와 `boundary.ts:18`의 503 매핑에만 있고 throw하는 곳이 없다. `error-handling.md`에는 이미 `DISABLED | 503 | 기능 일시 비활성`이 기록돼 있어, "남긴다면 문서에 한 줄을 추가한다"는 이전 선택지는 이미 충족돼 있었다.

- 결정: 실제 throw 지점도, 승인된 기능도 없는 예약 분류를 미래 가능성만으로 유지하지 않는다.
- `ERROR_CATEGORIES`, `ERROR_STATUS_MAP`, `error-handling.md` 표에서 제거한다.
- `ERROR_SAFE_MESSAGES`에는 애초에 `DISABLED`가 없으므로 수정 대상이 아니다.

제거 후 #83의 남은 체크리스트를 완료하고 Issue를 닫는다.

### 4순위 — #239 (불필요한 비결정성 제거)

**왜 여기인가**: 조사 결과 선택지가 좁혀져 실행이 짧아졌다. 다만 새 기준의 해석이 걸려 있어 #246·#83보다 뒤에 둔다.

두 값 모두 **id가 클라이언트를 벗어나지 않는다**:

- `ui/hooks/useImageList.ts:8` — 서버로 나가는 건 `getUrls()`의 url 배열뿐이고, id는 렌더 key와 `remove(id)` 대조용이다.
- `ui/context/guestbookDemo/reducer.ts:42` — 미리보기 데모 컨텍스트다. `demo-1`/`demo-2` 시드를 로컬 상태로만 다루고 영속화 경로가 없다.

따라서 원래 이슈에 적었던 "생성 위치를 서버로 이동"은 옮길 대상이 없어 성립하지 않는다. `adapters/browser/crypto/`도 만들지 않는다. 전역 고유성이 필요 없는 로컬 식별자 때문에 새 외부 경계를 만드는 것보다 비결정성 자체를 없애는 편이 단순하다.

- `useImageList`: 훅 인스턴스마다 `useRef` 단조 증가 카운터를 둔다. `add()` 콜백 안에서 새 id를 만들어야 하므로 Hook 호출 위치가 고정돼야 하는 `useId`는 맞지 않고, id 증가가 렌더를 일으킬 이유도 없으므로 state보다 ref가 맞다. 이 id는 렌더 key뿐 아니라 `remove(id)`의 로컬 항목 식별에도 쓰인다.
- `guestbookDemoReducer`: 현재 항목의 `demo-N` 최댓값에서 다음 id를 결정한다. `entries.length + 1`은 중간 항목 삭제 뒤 기존 id와 충돌할 수 있어 쓰지 않는다.
- **추가 발견**: 같은 reducer의 `new Date().toISOString()`도 비결정적이다. `createdAt`은 데모 타입과 초기 fixture에만 있고 렌더·정렬·영속화에 전혀 쓰이지 않으므로 필드 자체를 제거한다. 이로써 `src/ui/context/AGENTS.md`가 요구하는 순수 reducer가 된다.

새 기준과의 관계: 기준은 "모든 비결정성을 Adapter로 옮긴다"가 아니라 **필요한 비결정적 capability를 대체 가능한 경계로 감싼다**는 뜻이다. 필요 없는 비결정성은 먼저 제거한다.

따라오는 테스트:

- `useImageList`: 초기값과 이후 `add()` 항목의 id가 충돌하지 않고 `remove(id)`가 해당 항목만 제거한다.
- `guestbookDemoReducer`: 같은 입력 상태와 action이 같은 다음 id를 만들고, 삭제 뒤 추가해도 id가 충돌하지 않는다.

### 5순위 — #250 (공유 좌표 타입의 소유권)

**왜 여기인가**: 동작 결함은 아니지만 `adapters/AGENTS.md`의 "공용 타입은 core 사용" 규칙을 직접 어긴다. 범위가 작고 #242의 문맥이 남아 있을 때 정리할 수 있다.

`GeoState`는 `adapters/browser/deeplink/open-app.ts`에 정의돼 있지만 다음 계층이 함께 쓴다.

- deeplink Adapter
- `ui/hooks/useKakaomapGeocode.ts`
- `ui/hooks/useNavigationGeo.ts`
- preview route-local `navigation.ts`는 같은 `{ lat: number | null; lng: number | null }` shape을 두 번 인라인 선언한다.

nullable 좌표는 deeplink 외부 계약이 아니라 지도 탐색 흐름이 공유하는 순수 타입이다. `core/domain`으로 옮기고 네 소비처가 정의 파일에서 직접 import하게 한다. 반면 geolocation Adapter의 `Coordinates`는 "조회 성공 시 두 값이 모두 존재"한다는 별도 의미이므로 합치지 않는다.

### 6순위 — #238 (확인 다이얼로그)

**왜 마지막인가**: 여섯 작업 중 유일하게 공용 컴포넌트 설계가 선행되고, 확인 동작 6곳의 인터랙션과 테스트를 함께 바꾼다.

**범위가 정정됐다 — 3곳이 아니라 4파일 6곳이다.** 다만 여섯 동작이 전부 파괴적인 것은 아니다. 상품 복구도 확인창 교체 범위에는 포함하되 destructive 스타일은 적용하지 않는다.

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

Issue 제목도 주문 취소·리뷰 삭제만 가리키고 있어 상품 삭제·복구·영구 삭제까지 드러나게 수정한다.

**결정**:

- Radix AlertDialog primitive를 atom으로 추가한다. 파괴적 결정을 위한 의미·포커스·취소 동작이 일반 Dialog보다 정확하다.
- 프로젝트 `Button`과 문구를 조립하는 공용 확인 UI는 molecule로 둔다. 네 라우트가 공유하므로 공용 폴더 승격 기준도 충족한다.
- Promise 기반 전역 `useConfirm` 훅은 provider와 숨은 전역 상태를 새로 요구하므로 도입하지 않는다.
- 리뷰 수정 Dialog 안에서 확인 AlertDialog를 열 때 포커스 복귀와 부모 Dialog 상태를 component test로 확인한다.

**따라오는 테스트**:

- 기존 `window.confirm` spy는 3파일의 4개 위치다(`ProductTableRowAction.component.test.tsx:77`, `AdminReviewsTable.component.test.tsx:60,75`, `ReviewFormDialog.component.test.tsx:90`). 실제 다이얼로그에서 취소/확인 버튼을 누르는 방식으로 바꾼다.
- `ProductTableRowAction`의 공용 beforeEach spy는 복구·삭제·영구 삭제 3개 성공 테스트에 영향을 준다.
- `OrderCard`에는 주문 취소 동작 테스트가 전혀 없다. 다이얼로그 표시, 취소 시 Action 미호출, 확인 성공 시 `onOrderChanged`와 `router.refresh` 호출을 추가한다.

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

후속 Issue 감사에서도 같은 패턴이 두 번 더 확인됐다.

- #245는 상류 URL 인코딩만 보고 기본 UI 소비자의 SWR key를 따라가지 않아 end-to-end 결함이 남았다.
- #243은 "미인증 + 깨진 JSON"의 순서 차이는 기록했지만, 깨진 JSON 자체가 모든 호출자에게 500으로 오분류된다는 더 넓은 문제를 분류하지 않았다.

다음 감사는 파일 하나의 배치나 경계 내부만 확인하고 멈추지 않는다. **입력 생산자 → 진입점 → 위임 대상 → 최종 외부 호출**을 한 흐름으로 따라가고, 발견한 예외를 현재 taxonomy에 대입해 실제 사용자 응답까지 확인한다.
