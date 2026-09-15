# 공용 티어(src/ui/components) 조사 결과

조사범위: `atoms/`, `molecules/`, `organisms/`, `templates/` 전체(.test.tsx 등 테스트 파일 제외). 총 파일 수: atoms 46개, molecules 6개(디렉토리), organisms 15개(디렉토리), templates 1개(디렉토리). 각 티어 AGENTS.md의 축 A/B, `src/AGENTS.md` 식별자 규칙을 그대로 적용했다.

## 요약

| 카테고리 | 확신 높음 | 경계case(애매함 명시) | 계 |
|---|---|---|---|
| RAW_MARKUP | 1 | 1 | 2 |
| INLINE_UNPROMOTED | 1 | 0 | 1 |
| MISCLASSIFIED_TIER | 2 | 1 | 3 |
| NAMING_ISSUE | 1 | 0 | 1 |

`atoms/`는 전부 shadcn/Radix CLI 산출물이거나 조합 0개 프리미티브라 위반 없음(축 A 2단계에서 즉시 atom 확정, 검증 대상 아님).

---

## 1. RAW_MARKUP

| 파일경로 | 근거 | 권고 |
|---|---|---|
| `organisms/AddressField/AddressField.tsx:52-61` | 주소 검색 input을 `FormField`+`Input` 원본 조합으로 직접 재구현. `TextField`가 이미 이 조합(FormField+Input+onChange)을 캡슐화했는데도 안 씀 — `readOnly`+`onClick`(다음 주소 팝업) prop을 `TextField`가 지원 안 해서 못 쓴 것으로 보임 | `TextField`에 `onClick`/`readOnly` prop을 확장해 여기서도 재사용하거나, 팝업 트리거 전용 변형을 명시적으로 분리 |
| `organisms/BankField/BankField.tsx:79-90` (경계case) | 계좌번호 input도 `FormField`+`Input`+로컬 state 패턴을 손수 재구현. 다만 `BaseSelect`(은행 선택)와 한 `FormField` 라벨을 공유해야 해서 `TextField`를 그대로 못 씀 — 애매함: 단일 라벨 아래 select+input을 묶는 이 구조 자체는 정당한 조합일 수 있음 | 즉시 변경 비추천, AddressField 건과 함께 "라벨 하나에 이질적 두 입력을 묶는 패턴"을 위한 전용 organism 설계를 검토할 때 같이 판단 |

## 2. INLINE_UNPROMOTED

| 파일경로 | 조합된 atoms | 근거 | 권고 |
|---|---|---|---|
| `organisms/ImageField/ImageField.tsx:36-52` | `button`(raw html, Button atom 아님)+lucide `Upload`+`TypographyMuted`×2 | 업로드 트리거 블록이 아이콘+텍스트2줄+클릭 트리거를 묶은 자체완결형 위젯인데 별도 컴포넌트로 안 뽑음. 같은 파일이 "미리보기 1개" 패턴은 `ImagePreviewItem`으로 이미 추출해놨으면서 "빈 상태 업로드" 패턴만 인라인으로 남긴 비일관 | `ImagePreviewItem`과 대칭되는 별도 molecule(예: 업로드 트리거 전용)로 추출, raw `button`도 `Button` atom으로 통일 |

## 3. MISCLASSIFIED_TIER

| 컴포넌트 경로 | 현재 tier | 축A 판정 tier | 근거 | 권고 |
|---|---|---|---|---|
| `molecules/ConfirmDialog/ConfirmDialog.tsx` | molecule | organism | `AlertDialogTitle`+`Description`(표시, 액션 버튼과 별개 요소)과 `onConfirm`→`Button onClick` 명시적 핸들러 전달이 공존 — `organisms/AGENTS.md`의 `BottomActionBar`(가시성 표시+제출 전달) 판정 근거와 구조적으로 동일 | `organisms/ConfirmDialog/`로 이동 |
| `organisms/QueryFilterSelect/QueryFilterSelect.tsx` | organism | molecule | 동작이 "선택" 한 종류뿐(선택 결과로 내부에서 `router.push`만 함, 외부로 노출된 핸들러 없음) — `molecules/BaseSelect`와 동일한 판정 근거(선택 1종+조합 1개 이상=molecule). 또한 `BaseSelect`와 Select 조합이 90% 겹치는 중복 구현 | `molecules/QueryFilterSelect/`로 이동. 겸사겸사 내부적으로 `BaseSelect` 재사용 검토(별도 이슈로 등록 권장, 이번 조사 범위 밖) |
| `organisms/FormField/FormField.tsx` (경계case) | organism | molecule(엄격 적용 시) | `FormField` 자신이 소유한 동작은 라벨 표시+에러 표시(둘 다 "표시" 1종)뿐 — `children`은 투명 슬롯이라 핸들러 전달을 하지 않음. `organisms/AGENTS.md`가 예시로 든 5개 organism 목록에 `FormField`는 없음(검증 필요 대상). 다만 TextField 등 6개 organism이 이미 이 위에서 조립되고 있어 이동 시 파급 큼 | 즉시 이동 비추천. "입력을 감싸는 레이아웃 컨테이너"를 organism으로 볼지 팀 차원 판단 먼저 필요 — 별도 논의 안건으로 등록 |

## 4. NAMING_ISSUE

| 컴포넌트 | 현재 이름 | 문제 | 권고 이름 |
|---|---|---|---|
| `organisms/SidebarToggle/SidebarToggle.tsx` | `SidebarToggle` | 실제 구현은 `Breadcrumb` 네비게이션 헤더가 주 몸통이고 `SidebarTrigger`(atom)는 그 안의 아이콘 버튼 하나일 뿐 — 이름이 "사이드바 토글"만 가리켜 실제 책임(브레드크럼 표시)을 가림 | `PageHeader` 또는 `BreadcrumbHeader` 계열 |

---

## 부록. 제외 대상 / 미포함 사유

- `atoms/*` 전부: shadcn/Radix CLI 산출물이거나 조합 0개 프리미티브(`app-image.tsx`, `typography.tsx` 등) — 축 A 2단계에서 즉시 atom 확정.
- `molecules/AdminListHeading`, `molecules/TableShell`, `molecules/ProductCard`: `molecules/AGENTS.md` 예시 표에 이미 실측 근거와 함께 등재돼 재검증 생략.
- `organisms/TextField`, `ClipboardButton`, `RatingStars`, `BankField`, `BottomActionBar`: `organisms/AGENTS.md` 예시 표에 이미 등재. 단 `BankField`는 내부 RAW_MARKUP 여부만 별도 검증(위 1번 항목).
- `templates/LegalDocumentTemplate`: 자체 AGENTS.md에 이미 판정 근거 서술.
- `ImageField`의 raw `<button>` vs `Button` atom 불일치는 "atoms 조합 미승격"이 아니라 "atom 채택 누락"이라 4개 카테고리 밖 — INLINE_UNPROMOTED 항목의 부수 관찰로만 병기.
- `ProductGrid`/`QueryFilterSelect`가 내부에 도메인 타입(`ProductFilterAction`)이나 라우팅 로직(`router.push`)을 직접 쥔 것은 "조합/승격/네이밍" 범위 밖(아키텍처 경계 이슈)이라 미포함.
