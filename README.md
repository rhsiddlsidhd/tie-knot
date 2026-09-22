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
