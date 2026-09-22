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

`src/ui/components/`는 `atoms → molecules → organisms → templates` 4단계로 구성한다.
계층별 조립 규칙(디렉터리·파일명 일치 등)은
[`docs/conventions/naming-convention.md`](docs/conventions/naming-convention.md)에
정의돼 있다. 실제 데이터 바인딩까지 이어지는 예시로 관리자 목록 화면의 커서
페이지네이션을 든다:

```
atoms/table.tsx, atoms/button.tsx
  └─ molecules/TableShell        헤더 렌더링
  └─ molecules/CursorPagination  ─ / + 페이지 이동 (molecules/LinkButton 사용)
       └─ organisms/PaginatedTable   TableShell + CursorPagination 조합
            └─ admin 6개 페이지(products/orders/users/reviews 등)
               MongoDB 커서 기반 실데이터 바인딩
```

각 molecule은 자신을 감싸는 organism이 무엇인지 모른다 — `CursorPagination`은
`basePath`/`query`/`cursor` 같은 순수 prop만 받고 호출부(admin Template)가 실제
필터·커서 상태를 주입한다. 컴포넌트 디렉터리 구조 결정 배경은
[`docs/decisions/0007-per-component-directory-barrel.md`](docs/decisions/0007-per-component-directory-barrel.md)
참고.

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
