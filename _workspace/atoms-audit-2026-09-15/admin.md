# Admin 라우트 조사 결과

## 요약

| 카테고리 | 건수 |
|---|---|
| RAW_MARKUP | 6 |
| INLINE_UNPROMOTED | 2 (패턴 기준, 호출부는 6곳) |
| MISCLASSIFIED_TIER | 1 |
| NAMING_ISSUE | 1 |

조사 대상: `src/app/(admin)` 하위 전체 `.tsx`(테스트 제외). 이미 존재하는 organism 6종(TextField/FormField/RadioField/SelectField/SwitchField/NumberField 성격의 로컬 컴포넌트)을 기준선으로 삼아, 그걸 안 쓰고 `atoms/field`+`atoms/input`류를 직접 조합한 소비처를 찾았다.

## 1. RAW_MARKUP

| 파일경로 | 근거 | 권고 |
|---|---|---|
| `admin/premium-features/new/_components/PremiumFeatureRegistrationForm.tsx` | code/label에 `Field+FieldLabel+Input`, additionalPrice에 `InputGroup` 직접 조합. 형제 파일 `PremiumFeatureDialog.tsx`는 동일 필드에 이미 `TextField` organism을 씀 — 같은 도메인 안에서 두 가지 방식 공존 | code/label을 `TextField`로, additionalPrice를 아래 `NumberField` 승격안 적용 |
| `admin/premium-features/_components/PremiumFeatureDialog.tsx` | description(Textarea)·additionalPrice(InputGroup)만 raw `Field` 조합, code/label은 이미 `TextField` 사용 — 파일 하나 안에서 절반만 organism 적용 | description을 감쌀 TextareaField 신설 검토, additionalPrice는 `NumberField` 재사용 |
| `admin/settings/_components/AdminSettingsTemplate.tsx` | site-name/support-email에 `Field+FieldLabel+Input`, 신규가입/유지보수 토글에 `Field(horizontal)+FieldContent+FieldTitle+FieldDescription+Switch` — 두 패턴 모두 기존 organism과 100% 동형 | site-name/support-email → `TextField`, 토글 2개 → `SwitchField`(controlled 지원 필요, MISCLASSIFIED_TIER 항목 참고) |
| `admin/products/_containers/ProductEditDialog.tsx` | title/description/minQuantity/maxQuantity-display에 raw `Field+Input`, isPremium/isFeatured 토글에 raw horizontal `Field+Switch` | title→`TextField`(controlled 미지원 시 확장 필요), 토글 2개→`SwitchField` |
| `admin/products/new/_components/ProductRegistrationForm.tsx` | title/description/price/discount/priority/minQuantity/maxQuantity 전부 raw `Field` 조합, isPremium/isFeatured 토글도 raw. 같은 라우트 그룹의 `NumberField`(`../_components/NumberField`)가 이미 있는데 import조차 안 함 | price/priority/minQuantity/maxQuantity → `NumberField` 재사용, title/description → `TextField`, 토글 2개 → `SwitchField` |
| `admin/products/_components/ProductPermanentDeleteDialog.tsx` | `atoms/label`도 안 쓰고 네이티브 `<label htmlFor>` 태그를 직접 마크업(52행) — organism은커녕 atom도 미사용, 6개 중 가장 원시적인 형태 | 최소 `Label`(atoms) 교체, 이상적으론 `TextField` 또는 `FormField` 사용 |

## 2. INLINE_UNPROMOTED

| 파일경로 | 조합된 atoms | 근거 | 권고 |
|---|---|---|---|
| `ProductEditDialog.tsx` (376-395행), `ProductRegistrationForm.tsx` (360-374행) | `Checkbox` + `FieldLabel` (+ `Field orientation="horizontal"`) | 프리미엄 기능 다중선택 체크박스 리스트를 두 파일에서 각각 인라인으로 조합. `RadioField`는 있지만 체크박스용 대응 organism이 없음 — 같은 마크업이 파일 2곳에 완전히 동일한 구조로 반복 | `CheckboxField` 또는 `CheckboxGroupField` organism 신설(표시+입력 2종 동작 → organism), 두 파일 모두 교체 |
| `ProductEditDialog.tsx` (513-532행), `ProductRegistrationForm.tsx` (574-586행) | `Checkbox` + `FieldLabel` (단일, "무제한" 토글) | 위와 동일 조합을 단일 체크박스 형태로 또 반복 — 같은 파일 안에서도 그룹형과 단일형 두 번씩 나옴 | 위 `CheckboxField`가 단일 사용도 커버하도록 설계 |

## 3. MISCLASSIFIED_TIER

| 컴포넌트 경로 | 현재 tier/위치 | 축A 판정 tier | 근거 | 권고 |
|---|---|---|---|---|
| `admin/products/_components/NumberField.tsx` | 라우트 로컬 `_components/`(축B: 소비 라우트 1곳 — `ProductEditDialog` 경유 `/admin/products`만 실사용) | 현재는 axis B 기준 로컬 배치가 틀리지 않음. 단, `ProductRegistrationForm`(`/admin/products/new`)이 이 organism을 안 쓰고 동일 기능(단위 suffix 포함 숫자 입력)을 raw로 재구현 중(1번 표 참고) — 재사용을 채우면 소비 라우트가 2곳이 되어 공용 승격 대상으로 바뀜 | `ProductRegistrationForm`이 `NumberField`를 재사용하도록 먼저 고치고, 그 다음 `src/ui/components/organisms/NumberField/`로 승격 |

## 4. NAMING_ISSUE

| 컴포넌트 | 현재 위치 | 문제 | 권고 |
|---|---|---|---|
| `PremiumFeatureDialog` | `_components/PremiumFeatureDialog.tsx`(순수 UI) vs `_containers/PremiumFeatureDialog.tsx`(컨테이너) | 동일 이름을 두 파일이 공유해 컨테이너 내부에서 `PremiumFeatureDialog as PurePremiumFeatureDialog`로 alias해야 함(`_containers/PremiumFeatureDialog.tsx:10`) — import 시점에 별칭이 필요하다는 것 자체가 이름만으로는 구분 안 된다는 신호. `PremiumFeatureRegistrationForm`도 같은 구조(순수/컨테이너 동명) | 확신도 낮음(경계case) — 프로젝트에 이미 존재하는 관용 패턴(디렉토리로만 구분)일 수 있어 규칙 위반 단정은 보류. 다만 재발 시 컨테이너 쪽에 `Container` 접미사(`PremiumFeatureDialogContainer`) 부여를 검토할 가치는 있음 |

## 부록: 확인했으나 문제 없다고 판정한 것

- `RecentOrdersCard.tsx`, `PremiumFeaturesTemplate.tsx`: Card/Table/Empty/Badge 등 atoms를 조합하되 이미 라우트 로컬 컴포넌트로 정상 추출·단일 동작(표시)이라 molecule 판정에 부합, 승격 대상 아님.
- `AdminModal.tsx`, `PremiumFeatureRowAction.tsx`, `ReviewDeleteButton.tsx`, `UserActionsMenu.tsx`, `ProductTableRowSelect.tsx`: form atoms(label/input) 조합 없음, 대상 제외.
