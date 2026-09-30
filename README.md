# Tie Knot

웨딩 관련 상품을 취급하는 이커머스 플랫폼. 모바일 청첩장 템플릿을 시작으로, 답례품·웨딩
소품·방명록 굿즈·예식 용품 등 결혼 준비 과정에서 필요한 상품군으로 확장 가능한 구조를
지향한다.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Radix UI, shadcn 계열 컴포넌트
- **State**: Zustand(전역), React Context(도메인/트리 한정), SWR(서버 데이터 캐싱)
- **Database**: MongoDB Atlas + Mongoose
- **Auth**: JWT(`jose`) + `bcryptjs`
- **Payment**: PortOne (구 아임포트)
- **External services**: Cloudinary(이미지), Kakao Maps/우편번호, Nodemailer
- **Test**: Vitest(unit/component/integration), Playwright(e2e)

## Getting Started

### 요구 사항

- Node.js 20 이상
- MongoDB Atlas 접속 정보(팀 내부 공유) 또는 자체 클러스터

### 설치

```bash
npm ci
cp .env.example .env
```

`.env`에 필요한 값은 [`.env.example`](.env.example) 참고 — DB 접속 정보, JWT 시크릿,
Cloudinary/PortOne/Kakao 등 외부 서비스 키가 필요하다.

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인한다.

## Scripts

| Command                           | 설명                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `npm run dev`                     | 개발 서버 실행(Turbopack)                               |
| `npm run build`                   | 프로덕션 빌드                                           |
| `npm run start`                   | 프로덕션 서버 실행                                      |
| `npm run lint`                    | ESLint 검사                                             |
| `npm run tsc`                     | 타입 검사(`next typegen` 포함)                          |
| `npm run format` / `format:check` | Prettier 포맷 적용 / 검사                               |
| `npm run test:unit`               | Unit 테스트(Vitest)                                     |
| `npm run test:component`          | Component 테스트(Vitest + Testing Library)              |
| `npm run test:integration`        | Integration 테스트(실제 MongoDB, mongodb-memory-server) |
| `npm run test:e2e`                | E2E 테스트(Playwright)                                  |

## Testing

Unit → Component → Integration → E2E 4단계 테스트 피라미드를 따른다. 각 레이어의 책임
경계, 파일 명명·위치 규칙은 [`docs/__test/README.md`](docs/__test/README.md)에 정의돼
있다.

## Design Highlights

### 컴포넌트 계층 (Atomic Design)

`src/ui/components/`는 `ui → atoms → molecules → organisms → templates` 5개 폴더로
구성하고, 각 계층은 자신보다 왼쪽 계층만 import한다. `ui/`는 shadcn/Radix primitive
관리 영역이라 Atomic 계층으로 세지 않고, `atoms/`는 프로젝트가 직접 만든 최소 단위를
맡는다. 같은 계층끼리 결합하는 대신 공통 책임을 더 낮은 계층으로 내린다. 계층별 조립
규칙과 파일명 규칙은
[`docs/conventions/naming-convention.md`](docs/conventions/naming-convention.md),
디렉터리·배럴 구조의 결정 배경은
[`docs/decisions/0007-per-component-directory-barrel.md`](docs/decisions/0007-per-component-directory-barrel.md)에
정의돼 있다.

### 컴포넌트 활용 예시 — 관리자 목록 화면

`ui/table.tsx` 하나를 계층을 거쳐 조립하면 관리자 목록 6개 화면(상품·주문·사용자·리뷰·
프리미엄 기능·기능별 상품 연결)이 같은 골격을 공유한다. 화면마다 다른 것은 열 정의,
필터 옵션, 행 렌더뿐이다.

```
ui/       table, select, pagination, button, skeleton, empty   ← shadcn primitive
atoms/    typography
molecules/
  TableColumnHeader   정렬 토글 헤더 셀 (asc → desc → 해제)
  TableQueryState     TableBody 직속 상태 행 — 오류·스켈레톤·빈 결과
  SearchInputBar      debounce 검색 입력
  FilterSelect        "전체" 옵션을 포함한 단일 선택 필터
  OffsetPagination    총 건수 + 페이지 번호 이동
organisms/
  DataTable           columns → 헤더 반복 + aria-busy/opacity 갱신 표시
templates/
  ListPage            제목·설명 + 본문 배치
```

라우트 컨테이너(`_containers/AdminUsersTable.tsx` 등)가 이 부품들을 실데이터에 묶는다.

```
useOffsetList({ endpoint, sortKeys, params })
  │  searchParams 파싱 → page / q / sort+direction / 필터
  │  SWR key 생성 ──▶ GET /api/admin/users?page=2&sort=name&role=ADMIN
  ▼  setPage(pushState) · setSearch/toggleSort/setParam(replaceState)
ListPage
  ├─ FilterSelect × n  +  SearchInputBar
  ├─ DataTable        columns, sortState, onSort, isLoading, isRefreshing
  │    └─ TableQueryState   error, hasItems, emptyDescription, onRetry
  │         └─ TableRow     화면별 행 렌더
  └─ OffsetPagination page, totalPages, total, onPageChange
```

각 molecule은 자신을 감싸는 organism도, 어느 API를 보는지도 모른다 —
`OffsetPagination`은 `page`/`totalPages`/`onPageChange` 같은 순수 prop만 받고, 목록
상태는 URL이 소유하며 컨테이너가 `useOffsetList`로 읽어 주입한다. 그래서 어떤 조건으로
걸러낸 목록이든 주소를 그대로 공유할 수 있다. 다만 이력에 남기는 조작은 페이지
이동(`pushState`)뿐이고, 검색·정렬·필터는 `replaceState`라 뒤로 가기가 중간 입력마다
걸리지 않는다. 화면마다 달라지는 값은 컨테이너 옆 `_constants/`(`tableColumns`,
`filterOptions`, `labels`)가 소유해서 공용 컴포넌트에 도메인 지식이 새지 않는다.

상태 표시를 `DataTable`이 아니라 `TableQueryState`가 맡는 이유는 HTML 제약이다 —
`<TableBody>`의 직속 자식은 `<TableRow>`뿐이라 `<div>`로 감싸면 브라우저가 그 요소를
표 밖으로 끌어낸다. 오류·빈 결과도 `colSpan` 한 행으로 그려야 하고, 그래서 이 molecule만
`columnsCount`를 받는다. `ListPage`의 위치도 화면에 따라 갈린다. 목록만 있는 화면은
클라이언트 컨테이너가 직접 감싸지만, 상품 목록처럼 서버에서 결정되는 액션(휴지통 전환,
상품 등록)이 붙는 화면은 `page.tsx`가 `ListPage`를 소유하고 컨테이너를 children으로 넣는다.

### 인증 흐름

세션은 `token` httpOnly 쿠키 단일 트랙(access/refresh 이중 토큰 없음)으로 관리하며,
보호 라우트 접근은 Proxy(낙관적) → `page.tsx`(`verifySession()`) → Service(재검증)
3중 게이트를 통과한다. 자세한 설계 배경은
[`docs/security/page-access-control.md`](docs/security/page-access-control.md) 참고.

**1. 로그인 발급**

```
Browser
  │  POST 이메일/비밀번호
  ▼
Server Action (loginUserService)
  │  getUser(email) + comparePasswords  ──▶  MongoDB
  │  encrypt(JWT, type=REFRESH)
  ▼
Browser  ◀──  Set-Cookie: token (httpOnly)
```

**2. 보호 라우트 접근 — 3중 게이트**

```
Browser
  │  GET /admin/orders  (Cookie: token)
  ▼
Proxy (middleware)                      decrypt(token) 낙관적 검사
  │  실패(토큰 없음/만료/role 불일치) ──▶  redirect(/login 또는 /)
  ▼  통과
page.tsx: verifySession()               getAuth() 재검증 (cache)
  │  실패(세션 없음/role 불일치)     ──▶  redirect(/login 또는 /)
  ▼  통과
Service: requireAuth() / requireAdmin() 재확인
  ▼
MongoDB 쿼리  ──▶  렌더링된 페이지
```

Proxy 통과를 인가 완료로 취급하지 않는다 — 낙관적 체크일 뿐이라 `page.tsx`가 항상
재검증하고, service 레이어도 page 게이트 존재를 전제하지 않고 다시 확인한다
(`src/proxy.ts`, `src/services/auth.ts`).

## Documentation

프로젝트 컨벤션과 아키텍처 결정 사항은 코드 옆 `AGENTS.md`(계층별 규칙)와 `docs/`
아래 문서가 소유한다.

- [`docs/architecture/`](docs/architecture/README.md) — 데이터 접근 경로, 에러 처리 흐름
- [`docs/conventions/`](docs/conventions/README.md) — 네이밍, 라우트, import 규칙
- [`docs/decisions/`](docs/decisions/README.md) — 아키텍처 결정 기록(ADR)
- [`docs/security/`](docs/security/README.md) — 인증/인가, 접근 제어
- [`docs/validation/`](docs/validation/README.md) — 테스트 인프라, CI 게이트
- [`docs/__test/`](docs/__test/README.md) — 테스트 설계 원칙과 티어별 규칙

각 폴더의 세부 컨벤션은 해당 폴더의 `AGENTS.md`를 우선 확인한다.
