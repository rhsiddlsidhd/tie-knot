# Main/Preview 라우트 조사 결과

담당 범위: `src/app/(main)/**`, `src/app/(preview)/**` (route-local `_components/`, `_containers/`, `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` 전부. 테스트 파일 제외)

## 요약

| 카테고리 | 확신도 높음 | 확신도 낮음(경계) |
|---|---|---|
| RAW_MARKUP | 3 | 0 |
| INLINE_UNPROMOTED | 2 | 1 |
| MISCLASSIFIED_TIER | 0 | 1 |
| NAMING_ISSUE | 0 | 0 |

**조사 방법**: (1) `atoms/label` 직접 import grep(0건) + 네이티브 `<label>`/`<input>` 전체 트리 grep — RAW_MARKUP은 이 방식으로 대상 전체(테스트 제외 전 파일) 커버. (2) atoms 2개 이상 import하는 파일 55개를 전수 목록화해 전부 직접 열람 — INLINE_UNPROMOTED/MISCLASSIFIED_TIER/NAMING_ISSUE 판정. 55개 중 7개(`DateField`, `ComboboxField`, `CreateGuestbookForm`, `ReviewFormDialog`, `(products)/error.tsx`, `my-orders/loading.tsx`, `(my-order)/layout.tsx`+`(my-profile)/layout.tsx`)는 최초 조사에서 이미 열람 완료, 잔여 48개를 이어서 전부 열람해 담당 범위 100% 커버.

## 1. RAW_MARKUP

| 파일경로 | 근거 | 권고 |
|---|---|---|
| `src/app/(preview)/_components/CreateGuestbookForm.tsx:63-79` | 네이티브 `<label>`+`<textarea>`를 직접 마크업, `atoms/input.tsx`의 Tailwind 클래스 문자열을 그대로 복붙해 textarea에 붙임. `FormField`(label+error+children 범용 organism)가 이미 존재하는데 미사용 | `FormField`+`Textarea` atom 조합으로 교체 |
| `src/app/(main)/(my-order)/my-orders/_containers/ReviewFormDialog.tsx:132-155` | 위와 동일 패턴(네이티브 `<label htmlFor="content">`+`<Textarea>`+수동 에러 `<p>`), 같은 파일 130-137줄 평점 필드도 `<span>`+수동 에러로 동일 문제 반복(3곳) | `FormField`로 평점·리뷰내용 두 필드 모두 감싸기 |
| `src/app/(main)/support/_components/SupportTemplate.tsx:67-82` | `Field`+`FieldLabel`+`Input`/`Textarea` atom을 직접 조합(1:1 문의 폼). 같은 프로젝트의 `ShippingInfoCard.tsx`가 동일 상황에서 `FormField`+`Input`을 정확히 쓰고 있어 대조가 명확함 | `FormField`+`Input`/`Textarea`로 교체 |

## 2. INLINE_UNPROMOTED

| 파일경로 | 조합된 atoms | 근거 | 권고 |
|---|---|---|---|
| `src/app/(main)/(products)/error.tsx` | `Button`, `Card`, `TypographyH1`, `TypographyMuted` | 기존 `organisms/ErrorFallback`(atoms만 조합, 동일 목적)을 그대로 재구현함 — 같은 그룹 형제 `(main)/error.tsx`는 정상적으로 `ErrorFallback` 재사용 중이라 대조가 명확함 | `ErrorFallback` organism으로 교체(`title`/`description` prop으로 문구만 커스터마이즈) |
| `SignupForm.tsx`(2곳) / `LoginForm.tsx`(1곳) / `TermsAgreementCard.tsx`(1곳) — 4개 파일·4곳 | `Checkbox`, `Field`, `FieldLabel` | "체크박스+약관 동의 라벨" 조합이 서로 다른 라우트 4곳에서 매번 손으로 반복됨(`src/ui/components/AGENTS.md` 축B: 최종 소비 라우트 2곳 이상 → 공용 컴포넌트 후보). `SwitchField`는 있는데 체크박스용 대응 organism이 없음 | `CheckboxField` 공용 organism 신설해 4곳 교체 |

| `src/app/(main)/(my-order)/my-orders/loading.tsx` (확신도 낮음) | `Card`, `CardContent`, `CardHeader`, `Skeleton` | `loading.tsx`는 `src/app/AGENTS.md`상 "순수 정적 skeleton만" 규정이 있어 컴포넌트 추출 의무가 명시돼 있진 않음. 다만 Card+Skeleton 조합이 반복(3회, 20-35줄)돼 로컬 molecule(`OrderCardSkeleton`) 추출 여지는 있음 | 강제 아님 — 반복도가 늘면 로컬 molecule 추출 검토 |

**명시적 제외(오탐 방지용 기록)**: `(my-order)/layout.tsx`와 `(my-profile)/layout.tsx`의 Sidebar 셸 코드가 거의 동일하지만, `src/app/AGENTS.md`가 "여러 layout이 겹치는 셸 조각은 공용 컴포넌트로 승격하지 않고 각 layout.tsx가 직접 정의한다(각 레이어 독립 진화)"고 **명시적으로 예외 처리**함 — INLINE_UNPROMOTED 후보에서 제외.

## 3. MISCLASSIFIED_TIER

| 파일경로 | 현재 자체 표기 | 축A 재판정 | 근거 | 권고 |
|---|---|---|---|---|
| `src/app/(main)/_components/LiveDemoSection.tsx:12` (확신도 낮음) | 코드 주석에 "(Organism)"으로 자체 표기 | molecule에 더 가까움 | 동작이 표시 1종뿐(카드/이미지/버튼은 전부 단순 표시·네비게이션 링크, 별도 상태 변화나 입력 없음) — `src/ui/components/AGENTS.md` 축A 기준 "동작 2종 이상"에 미달 | route-local이라 폴더 이동은 불필요, 주석 문구만 "(Molecule)" 또는 삭제 |

나머지 47개 파일은 표시(Card/Typography 등) 또는 표시+입력 2종 동작이 명확한 organism 패턴(`DateField`, `ComboboxField`, `QuantityStepper`, `ProductFilters` 등)이었고, 축A 판정과 실제 구조가 모두 일치함 — 문제 없음.

## 4. NAMING_ISSUE

확인된 위반 없음(55개 전수 열람 기준). 최근 커밋(`73c222a` "enforce identifier naming conventions #287")으로 프로젝트 전역 식별자 케이스 규칙이 이미 강제 적용됐고, 이번 조사가 별도로 본 "역할에 안 맞는 이름"·"소비처 특정 이름" 관점에서도 위반 사례를 찾지 못함.
