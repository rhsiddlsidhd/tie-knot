# Atoms 조합 승격/네이밍 전수조사 — 2026-09-15

담당 영역별 원본 조사 파일(모든 근거·전체 표): [`admin.md`](./admin.md) · [`main.md`](./main.md) · [`ui-components.md`](./ui-components.md)

## 0. 요약

| 카테고리 | admin | main/preview | ui-components | 계 |
|---|---|---|---|---|
| RAW_MARKUP | 6 | 3 | 2(확신1+경계1) | 11 |
| INLINE_UNPROMOTED | 2패턴(6곳) | 2+경계1 | 1 | 5패턴(경계1 별도) |
| MISCLASSIFIED_TIER | 1 | 경계1 | 2+경계1 | 3(경계2 별도) |
| NAMING_ISSUE | 경계1 | 0 | 1 | 1(경계1 별도) |

- 스캔 파일 수: admin 전체 + main/preview 55개(100%) + ui-components 68개(atoms 46/molecules 6/organisms 15/templates 1) — 3개 영역 전부 무차별 전수 완료.
- 방법: fork 3개(영역 분할) 병렬 grep+열람, axis A/B(`src/ui/components/AGENTS.md`) + 식별자 규칙(`src/AGENTS.md`) 적용.
- 핵심 원인: 기존 organism(`TextField`/`FormField`/`SwitchField` 등)이 있는데도 소비처가 `Field`+`Input`/`Textarea`/`Switch` 원본 atoms를 손으로 재조합하는 패턴이 RAW_MARKUP 11건 중 다수. 체크박스+라벨 조합용 organism(`CheckboxField`)이 아예 없어 4개 이상 파일에서 동일 마크업이 반복(INLINE_UNPROMOTED 최다 패턴).

## 1. 최우선 조치 후보 (확신 높음, 근거 명확)

| # | 대상 | 카테고리 | 근거(요약) | 권고 |
|---|---|---|---|---|
| 1 | `admin/products/_components/ProductPermanentDeleteDialog.tsx:52` | RAW_MARKUP | atoms `Label`조차 안 쓰고 네이티브 `<label>` 직마크업 | `Label`/`TextField`로 교체 |
| 2 | `admin/products/new/_components/ProductRegistrationForm.tsx` | RAW_MARKUP | 같은 라우트그룹 `NumberField` organism 존재하는데 미사용, 전 필드 raw 조합 | `NumberField`+`TextField`+`SwitchField` 재사용 |
| 3 | `admin/settings/_components/AdminSettingsTemplate.tsx` | RAW_MARKUP | site-name/email/토글 전부 기존 organism과 100% 동형 raw 조합 | `TextField`+`SwitchField` 교체 |
| 4 | `admin/products/_containers/ProductEditDialog.tsx` | RAW_MARKUP | title/desc/수량 필드+토글 2개 raw 조합 | `TextField`+`SwitchField` 교체 |
| 5 | `(preview)/_components/CreateGuestbookForm.tsx:63-79` | RAW_MARKUP | `FormField` 있는데 네이티브 label+textarea 직접 | `FormField`+`Textarea` 교체 |
| 6 | `(my-order)/my-orders/_containers/ReviewFormDialog.tsx:130-155` | RAW_MARKUP | 평점·리뷰내용 3곳 동일 문제 | `FormField` 교체 |
| 7 | `(main)/support/_components/SupportTemplate.tsx:67-82` | RAW_MARKUP | 형제 파일 `ShippingInfoCard`는 이미 `FormField` 정상 사용 중, 대조 명확 | `FormField`+`Input`/`Textarea` 교체 |
| 8 | `ProductEditDialog.tsx`+`ProductRegistrationForm.tsx` 체크박스 4곳 | INLINE_UNPROMOTED | `Checkbox`+`FieldLabel` 조합이 그룹형/단일형으로 반복 | `CheckboxField` organism 신설 |
| 9 | `SignupForm.tsx`(2)+`LoginForm.tsx`(1)+`TermsAgreementCard.tsx`(1) | INLINE_UNPROMOTED | 약관동의 체크박스, 4개 라우트에서 반복(축B: 공용 승격 요건 충족) | 위 `CheckboxField`가 커버 |
| 10 | `(products)/error.tsx` | INLINE_UNPROMOTED | 형제 `(main)/error.tsx`는 `ErrorFallback` 정상 재사용, 이 파일만 재구현 | `ErrorFallback` 교체 |
| 11 | `organisms/AddressField/AddressField.tsx:52-61` | RAW_MARKUP | `TextField` 있는데 `readOnly`/`onClick` 미지원이라 손수 재구현 | `TextField`에 prop 확장 |
| 12 | `organisms/ConfirmDialog`(현 molecule) | MISCLASSIFIED_TIER | 표시+핸들러전달 2종 동작 → organism 기준 충족 | `organisms/ConfirmDialog/`로 이동 |
| 13 | `organisms/QueryFilterSelect`(현 organism) | MISCLASSIFIED_TIER | 선택 1종뿐, `BaseSelect`와 동일 판정 근거 | `molecules/QueryFilterSelect/`로 이동 |
| 14 | `organisms/SidebarToggle` | NAMING_ISSUE | 실체는 Breadcrumb 헤더, 이름은 사이드바 토글만 지칭 | `PageHeader`/`BreadcrumbHeader` 개명 |
| 15 | `admin/products/_components/NumberField.tsx` | MISCLASSIFIED_TIER | `ProductRegistrationForm`이 재사용만 하면 소비 라우트 2곳 충족 → 공용 승격 대상 | #2 먼저 고친 뒤 `organisms/NumberField/`로 승격 |

## 2. 경계case (판단 유보, 팀 논의 필요)

| 대상 | 카테고리 | 애매한 이유 |
|---|---|---|
| `organisms/BankField/BankField.tsx:79-90` | RAW_MARKUP(경계) | 은행선택+계좌번호가 라벨 하나 공유 — 이질적 두 입력 결합 패턴 자체가 정당할 수 있음 |
| `organisms/FormField/FormField.tsx` | MISCLASSIFIED_TIER(경계) | 엄격 적용시 molecule(표시만 2종)이지만 organism 6종이 이 위에 조립돼 있어 이동 파급 큼 |
| `(main)/_components/LiveDemoSection.tsx:12` | MISCLASSIFIED_TIER(경계) | 자체 주석은 "(Organism)"이나 실제 동작은 표시 1종 → molecule에 더 가까움, route-local이라 이동 불요 |
| `(my-order)/my-orders/loading.tsx` | INLINE_UNPROMOTED(경계) | `loading.tsx` skeleton 3회 반복, 승격 강제 규정은 없음 |
| `PremiumFeatureDialog`/`PremiumFeatureRegistrationForm` 순수/컨테이너 동명 | NAMING_ISSUE(경계) | import 시 alias 필요하지만 프로젝트 기존 관용 패턴일 수 있음 |

## 부록 A. 확인 완료·문제 없음 (반복 언급 방지용 기록)

- admin: `RecentOrdersCard`, `PremiumFeaturesTemplate`, `AdminModal`, `PremiumFeatureRowAction`, `ReviewDeleteButton`, `UserActionsMenu`, `ProductTableRowSelect`
- main/preview: 나머지 47개 파일(`DateField`/`ComboboxField`/`QuantityStepper`/`ProductFilters` 등 기존 organism 패턴과 구조 일치), `(my-order)/layout.tsx`+`(my-profile)/layout.tsx` Sidebar 중복은 `src/app/AGENTS.md` 명시적 예외
- ui-components: `atoms/*` 전체(shadcn/Radix 산출물), `molecules/AdminListHeading`·`TableShell`·`ProductCard`, `organisms/TextField`·`ClipboardButton`·`RatingStars`·`BottomActionBar`, `templates/LegalDocumentTemplate` — 각 AGENTS.md 예시 표에 이미 등재
- 조사 범위 밖으로 명시 제외: `ImageField`의 raw `<button>`(atom 채택 누락이지 승격 이슈 아님), `ProductGrid`/`QueryFilterSelect`의 도메인 로직 결합(아키텍처 경계 이슈)

## 부록 B. 조사 방법

- 영역 분할: admin 라우트 / main+preview 라우트 / `src/ui/components` 공용 티어, fork 3개 병렬 실행
- 1차 main fork가 55개 중 7개만 샘플 열람 후 "한계"로 보고 → 무차별 전수 원칙 위반으로 재개 지시, 잔여 48개 마저 열람해 100% 커버 완료
- 판정 기준 원본: `src/ui/components/AGENTS.md`(axis A/B), `src/ui/components/atoms/AGENTS.md`, `src/AGENTS.md`(식별자 규칙)
