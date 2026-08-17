# Handoff — tie-knot 디렉토리 재구조화

프로젝트: `tie-knot`. 웨딩 이커머스. **Next.js 16.2.10 (App Router), Vitest, Mongoose + MongoDB.**

이 문서 하나로 배경·기준·계획이 다 담긴다. 별도 조사 없이 착수 가능.

---

## 1. 무엇이 바뀌는가 — 축 교체

이 재구조화의 본질은 폴더를 옮기는 게 아니라 **디렉토리가 인코딩하는 축을 바꾸는 것**이다.

### 기존 축

**(런타임: server / client / shared) × (외부 SDK를 감싸는가: lib / utils)**

| | `shared/` | `client/` | `server/` |
|---|---|---|---|
| `utils/` (SDK 안 감쌈) | 순수 함수 | 브라우저 side-effect | — |
| `lib/` (SDK 감쌈) | — | 브라우저 SDK 래퍼 | 서버 SDK 래퍼 |

이 축은 4개 AGENTS.md에 명확히 문서화돼 있고, 위반도 거의 없다. **축 자체는 흐릿하지 않다.**

문제는 둘이다.

**첫째, 축이 절반만 덮는다.** `server/services`, `server/actions`, `server/models`, `client/components`, `client/hooks`, `client/store`, `shared/schemas`, `shared/types`는 이 격자 밖에 있다. 실제 코드의 대부분이 축으로 설명되지 않는다.

**둘째, 축이 테스트 전략과 직교한다.** 런타임과 SDK 여부는 "테스트에 뭐가 필요한가"와 아무 상관이 없다. 그래서 한 폴더에 테스트 성격이 다른 파일이 공존한다.

### 신규 축

**역할(계층)** 하나. 런타임 축은 디렉토리에서 제거하고 컴파일러로 옮긴다.

| 기존이 인코딩하던 것 | 신규에서 어디로 |
|---|---|
| 런타임 (server/client/shared) | **`server-only` / `client-only` import** — 컴파일 에러로 승격 |
| SDK를 감싸는가 (lib/utils) | **`adapters/` 층 하나로 흡수** |
| (인코딩 안 되던 것) 역할 | **디렉토리 이름 그 자체** |
| (인코딩 안 되던 것) 테스트 전략 | **역할이 정해지면 자동으로 따라옴** |

### 왜 이 교체가 두 질문에 다 답하나

역할이 정해지면 **그 층이 관통하는 경계 개수**가 정해진다. 테스트 전략은 관통 경계 개수의 함수다. 그래서 역할 축은 테스트 축과 직교하지 않고 **일치**한다.

```
역할 → 관통 경계 → 테스트 전략
```

| 층 | 관통 경계 | 테스트 |
|---|---|---|
| `core/` | 0 | unit, 준비물 없음 |
| `adapters/` | 1 (외부 SDK) | unit + SDK mock |
| `services/` `models/` `actions/` `app/api/` | 1 (DB) | integration + mongod |
| `ui/hooks/` | 1 (HTTP) | integration + MSW |
| `ui/components/` `ui/stores/` | 0 | unit (jsdom) |
| `app/**/page.tsx` | 전부 | E2E |

번들 안전은 디렉토리가 아니라 `server-only` / `client-only`가 맡는다. **디렉토리 컨벤션보다 강하다** — 어기면 빌드가 깨지고, 사람이 문서를 안 읽어도 강제된다.

### 한 문장

**"무엇으로 만들어졌나"에서 "무슨 역할인가"로 축을 바꾼다.**

---

## 2. 배경 — 왜 지금 구조가 못 답하나

### 증거 1 — `src/server/lib/` 한 폴더에 3종

| 파일 | 테스트 준비물 |
|---|---|
| `bcrypt/hash.ts`, `jose/*`, `cloudinary/sign.ts` | **없음** |
| `cloudinary/upload.ts` `cleanup.ts`, `nodemailer/send.ts` | SDK mock |
| `cookies/{get,set,delete}.ts` | Next 런타임 mock |
| `mongodb/connect.ts` | **진짜 mongod** |

같은 `cloudinary/` 폴더 안에서도 `sign.ts`는 mock 0, `upload.ts`는 mock 필요.

### 증거 2 — `src/client/lib/`도 3종

네트워크(`cloudinary`·`portone`) / React 훅(`kakao`·`daum`) / 순수 함수(`cn`).

### 비유

서랍에 "겨울에 쓰는 것"을 다 넣었다 — 목도리, 코트, 장갑, 가습기. 기준은 완벽하다. 근데 "이 서랍 어떻게 세탁해?"엔 답이 없다.

**서랍이 잘못 나뉜 게 아니다. 세탁법은 서랍이 답할 수 있는 질문이 아니었을 뿐이다.**

### 부수 문제

**vitest project 경계가 파일 위치에 얽혀 있다.** `src/app/**/_hooks/**`는 `integration-client`(jsdom), `src/app/api/**`는 `integration-server`(mongod), 나머지 `src/app/**`는 `integration-app`(mongod 순차). 훅 테스트를 `_hooks` 밖에 두면 mongod가 뜨는 순차 project로 간다.

**규칙 강도가 사고 비용과 안 맞는다.** "폴더명 = 라이브러리명" 규칙은 어겨도 아무것도 안 깨지는데 예외가 2/7(29%)이고, 예외 설명이 규칙 본문보다 길다.

**문서 모순 1건.** `client/lib/cn/merge.ts`는 side-effect가 없는데 `lib/`에 있다. `shared/utils/AGENTS.md`가 금지한 케이스다.

**타입 누수.** UI 컴포넌트가 `@/server/models`에서 타입을 가져온다 (`OrderJSON`, `PayStatus`, `PayMethod`). `import type`이라 런타임 의존은 없지만 화살표 방향이 반대다.

---

## 3. 목표 구조

```
src/
├── app/                        controller + view (Next.js가 위치 강제)
│   ├── (admin)/ (main)/ (preview)/
│   │   ├── page.tsx            읽기 controller + view      → E2E
│   │   └── _components/        이 라우트 전용              → unit (jsdom)
│   └── api/**/route.ts         쓰기·fetch controller       → integration (mongod)
│
├── actions/                    Server Actions. 얇게        → integration (mongod)
├── services/                   비즈니스. 규칙 + 순서       → integration (mongod)
├── models/                     mongoose 스키마             → 테스트 안 함
├── db/
│   └── connect.ts              dbConnect                   → integration (mongod)
│
├── adapters/                   외부 SDK 경계. 폴더 1개 = 서비스 1개
│   ├── bcrypt/                 server-only                 → unit (mock 0)
│   ├── jose/                   server-only                 → unit (mock 0)
│   ├── cookies/                server-only (next/headers)  → unit (Next mock)
│   ├── nodemailer/             server-only                 → unit (SDK mock)
│   ├── cloudinary/             sign·cleanup = server-only  → unit (SDK mock)
│   │                           upload = client-only
│   ├── portone/                client-only                 → unit (SDK mock)
│   ├── kakao/ daum/            client-only (훅)            → unit (jsdom)
│   └── deeplink/               client-only (window.open)   → unit (jsdom)
│
├── core/                       순수. I/O 0. src 내부 의존 0
│   ├── schemas/                zod request/response        → unit
│   ├── domain/                 도메인 타입 + 계산          → unit
│   ├── content/                *.json 정적 데이터          → 테스트 안 함
│   └── utils/                  도메인 무관 순수 함수       → unit
│
├── ui/
│   ├── components/             props만. fetch 금지         → unit (jsdom)
│   ├── hooks/                  SWR/fetch                   → integration (MSW)
│   └── stores/                 zustand + context           → unit
│
└── boundary.ts                 에러→응답 번역 (A/B 공용)   → unit
```

### 폴더 → 테스트 전략, 1:1 (예외 없음)

| 층 | 테스트 | 준비물 |
|---|---|---|
| `core/**`, `ui/components/**`, `ui/stores/**`, `boundary.ts` | unit | 없음 |
| `adapters/**` | unit | SDK mock |
| `ui/hooks/**` | integration | MSW |
| `db/`, `models/**`, `services/**`, `actions/**`, `app/api/**` | integration | **mongod** |
| `app/**/page.tsx` | E2E | 브라우저 |

### 흐름

```
app/api/route.ts  ─┐
actions/          ─┼─▶ services/ ─▶ models/ ─▶ mongoose ─▶ mongod
app/**/page.tsx   ─┘        │
                            └─▶ adapters/  (외부 SDK)
                     모두 ─▶ core/  (순수)
```

Express의 `route → controller → service → model → db`와 같다. Next는 파일 위치가 라우팅이라 route/controller가 합쳐지고, 진입점이 셋(route.ts / action / page.tsx)으로 늘어난다.

---

## 4. 번들 안전 — 컴파일러가 맡는다

Next 16 공식 권장 (`node_modules/next/dist/docs/01-app/02-guides/data-security.md:245`).

```ts
import "server-only";   // db/, models/, services/, 서버 adapters
import "client-only";   // 브라우저 adapters
// actions/ 는 대상이 아니다 — 아래 참고
```

`actions/`에는 `server-only`를 넣지 않는다. Server Action은 Client Component가
import하도록 설계된 것이고, `"use server"`가 컴파일 시 RPC 스텁을 만들어 서버 경계를
이미 세운다. 두 지시자는 같은 파일에서 양립할 수 없어 빌드가 깨진다(실제로 겪음 —
단계 1 시도 중 `'server-only' cannot be imported from a Client Component module`).
`LoginForm.tsx`·`CheckoutForm.tsx` 같은 `"use client"` 컴포넌트가 `useActionState`로
action을 부르는 것이 정상 용법이다.

다만 이 때문에 `actions/`에는 구멍이 남는다 — `"use server"` 없는 헬퍼 파일을 두고
클라이언트가 배럴로 가져가면 `server-only`가 못 막는다. `actions/`에는 action만 둔다.

이게 켜지면 `adapters/cloudinary/`를 **한 폴더로 합칠 수 있다** — 지금 server/client 두 곳에 찢어져 있는 이유가 사라진다.

**단, `adapters/cloudinary/`에 배럴(`index.ts`)을 두지 않는다.** PR #65가 깨진 진짜 원인은 폴더가 아니라 배럴이었다 — 배럴 하나가 server-only와 client-only를 같이 재수출하면 어느 쪽에서 import해도 반대편이 딸려온다.

같은 이유로 **`core/`에 mongoose를 아는 코드를 두지 않는다.** `toObjectId` 같은 함수는 순수하지만 mongoose에 의존하므로, `core/utils/` 배럴에 들어가면 UI가 `cn`을 import할 때 mongoose가 클라 번들로 딸려온다. **순수성이 배치 기준이 아니라, 의존 대상이 배치 기준이다.**

---

## 5. 의존성 방향 — lint가 맡는다

`core/`가 순수하다는 게 "주장"이 아니라 "사실"이 되게 한다. tsc는 `core/`에서 `models/`를 import해도 통과시킨다.

```js
// eslint.config.mjs
{
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "import/no-restricted-paths": ["error", {
      zones: [
        { target: "./src/core", from: "./src/db",       message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/models",   message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/services", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/adapters", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/ui",       message: "core는 순수해야 한다" },
        { target: "./src/ui",   from: "./src/db",       message: "UI는 DB를 직접 못 만진다" },
        { target: "./src/ui",   from: "./src/models",   message: "UI는 DB를 직접 못 만진다" },
        { target: "./src/ui",   from: "./src/services", message: "UI는 service를 직접 못 부른다" },
      ],
    }],
  },
}
```

`eslint-plugin-import`는 **이미 설치·등록돼 있다** (`eslint-config-next/core-web-vitals`가 등록). 신규 의존성 0.

---

## 6. 이관표

| 현재 | 신규 | 비고 |
|---|---|---|
| `shared/schemas/{request,response}` | `core/schemas/` | |
| `shared/utils/*` | `core/utils/` (도메인성 있으면 `core/domain/`) | |
| `shared/utils/seoul-open-api.ts` | `core/utils/seoul-open-api-parser.ts` | 순수 파서. 이름만 정정 |
| `shared/types`, `shared/constants` | `core/domain/` | |
| `client/lib/cn/merge.ts` | `core/utils/cn.ts` | side-effect 0 → core |
| `data/*.json` | `core/content/` | |
| `server/lib/{bcrypt,jose,cookies,nodemailer}` | `adapters/*` + `server-only` | |
| `server/lib/cloudinary/*` | `adapters/cloudinary/` + `server-only` | |
| `client/lib/cloudinary/upload.ts` | `adapters/cloudinary/` + `client-only` | **폴더 합침. 배럴 금지** |
| `client/lib/{portone,kakao,daum}` | `adapters/*` + `client-only` | |
| `client/utils/open-app.ts` | `adapters/deeplink/` + `client-only` | `client/utils/` 층 소멸 |
| `server/lib/mongodb/connect.ts` | `db/connect.ts` | |
| `server/models` | `models/` + `server-only` | |
| `server/services/*.service.ts` | `services/*.ts` | `.service` 중복 제거 |
| `server/actions/*` | `actions/*` | **얇게 만들기 — 아래 참고**. server-only 넣지 않는다 (§4) |
| `server/boundary.ts` | `boundary.ts` | |
| `client/components/{atoms,molecules,organisms,templates}` | `ui/components/` | atomic 계층 유지 여부는 별건 |
| `client/hooks` + `app/**/_hooks` | `ui/hooks/` | **한 곳으로** |
| `client/store` + `client/context` | `ui/stores/` | |
| `app/**/_components` | 재사용 2곳↑이면 `ui/components/`, 아니면 잔류 | |
| `app/api/**/route.ts` | 유지 | Next.js 강제 |

### `actions/` 얇게 만들기 — 가장 큰 실작업

지금 `src/server/actions`에 `.test.ts` 24개 + `.integration.test.ts` 3개다. **unit 테스트 24개는 actions에 로직이 있다는 신호** (fat controller).

목표 형태:

```ts
// src/actions/createOrder.ts
"use server";
import "server-only";

export async function createOrder(formData: FormData) {
  const parsed = createOrderSchema.safeParse(Object.fromEntries(formData));  // 파싱
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error) };   // 응답 형태
  return orderService.create(parsed.data);                                    // 위임 — 끝
}
```

로직은 `services/`로 내려간다. unit 테스트 대부분이 services의 integration 테스트로 흡수되거나 삭제된다.

**이게 "층 하나에 세탁법 하나"를 실제로 성립시키는 조건이다.** actions에 로직이 남으면 여전히 두 종류 테스트가 공존한다.

### 타입 누수 정리

`OrderJSON`, `PayStatus`, `PayMethod` 등을 `models/`에서 `core/domain/`으로 옮기고, mongoose 스키마가 그 타입을 **구현하는** 방향으로 뒤집는다. 지금은 UI가 DB 스키마 파일을 쳐다보고 있다.

---

## 7. vitest 설정 단순화

```
unit                → core/**, adapters/**, ui/components/**, ui/stores/**, boundary
integration-client  → ui/hooks/**
integration-server  → db/**, models/**, services/**, actions/**, app/api/**
integration-app     → app/** (api 제외)
```

`src/app/**/_hooks`를 exclude로 파내던 규칙이 사라진다 — 훅이 전부 `ui/hooks/`에 모였으니까. **"`src/app` 아래 파일 위치가 실행환경을 결정한다"는 함정이 없어진다.**

`vitest.config.ts`, `docs/validation/testing-classification.md`, `docs/validation/test-infrastructure.md` 동시 갱신 필요.

---

## 8. AGENTS.md 규칙 (신규 — 사용자 확정)

### 8.1 서식 규칙

> 서식은 내용의 형태를 반영한다 — 순서는 번호, 나열은 불릿, 다축은 표, 흐름은 화살표, 계층은 중첩, 실행물은 코드블록, 인과·판단은 산문. 해당 형태가 없으면 서식 쓰지 마라.

모든 AGENTS.md에 적용된다. 이 규칙 자체는 루트 `AGENTS.md`에 둔다.

실무 함의:
- "이 폴더는 X를 담당한다" → 한 문장. 불릿 아님
- 규칙 3개 이상 나열 → 불릿
- 하위 디렉토리별 속성 2개 이상 → 표
- "A라서 B다" 인과 → **산문**. 불릿로 쪼개면 인과가 사라진다
- 현재 AGENTS.md들이 인과를 불릿에 욱여넣은 곳이 많다 (`server/lib/AGENTS.md`의 폴더명 예외 설명). 재작성 시 산문으로 편다

### 8.2 공통 템플릿 — 모든 AGENTS.md

```markdown
# AGENTS.md — src/{path}/

> {디렉토리 정의 — 한 문장}
> Last updated: YYYY-MM-DD
```

### 8.3 하위 디렉토리가 있는 경우

공통 템플릿 + 아래.

```markdown
## 공통 디렉토리 컨벤션

{모든 하위 디렉토리에 적용되는 규칙}

## 디렉토리

| 디렉토리 | 담당 | 테스트 |
|---|---|---|
| `foo/` | ... | unit |

## 경계

{여기 두지 않는 것 — 어디로 가야 하는지까지}
```

테스트 전략은 index 테이블의 **열**로 들어간다. 별도 섹션 없음.

**한 열이 전부 같은 값이면 그 자체가 신호다** — 이 폴더는 테스트 관점에서 균질하다는 뜻. 값이 갈리면 층 분리를 재검토할 근거가 된다.

작성 예:

```markdown
# AGENTS.md — src/core/

> 순수 함수·타입·스키마 전담. I/O 없음, src 내부 다른 층을 import하지 않음.
> Last updated: 2026-08-17

## 공통 디렉토리 컨벤션

폴더명은 담는 대상의 성격을 쓴다. 파일명은 kebab-case, 파일당 목적 1개.

## 디렉토리

| 디렉토리 | 담당 | 테스트 |
|---|---|---|
| `schemas/` | zod request/response | unit |
| `domain/` | 도메인 타입·계산 | unit |
| `content/` | 정적 JSON | 없음 |
| `utils/` | 도메인 무관 순수 함수 | unit |

## 경계

I/O가 있으면 여기 두지 않는다 — 외부 SDK를 감싸면 `src/adapters/{서비스명}/`, DB 접근이면 `src/db/` 또는 `src/models/`.

순수하더라도 mongoose 같은 서버 전용 패키지에 의존하면 두지 않는다 — 배럴을 통해 클라이언트 번들로 새기 때문이다. 기준은 "순수한가"가 아니라 "이 의존이 클라이언트에 가도 되는가"다.
```

### 8.4 파일만 있는 경우

공통 템플릿 + 아래.

```markdown
## 공통 파일 컨벤션

{네이밍, 파일당 목적 수, 배럴 정책}

## 테스트

{한 줄 — 종류와 준비물}

## 경계

{여기 두지 않는 것 — 어디로 가야 하는지까지}
```

작성 예:

```markdown
# AGENTS.md — src/services/

> 비즈니스 규칙과 유스케이스 조합 전담. HTTP를 모르고, 외부 SDK는 adapters를 통해서만 만진다.
> Last updated: 2026-08-17

## 공통 파일 컨벤션

파일 1개 = 도메인 1개. 파일명에 `.service`를 붙이지 않는다 — 폴더가 이미 말한다.
모든 파일 최상단에 `import "server-only"`.

## 테스트

integration. 진짜 mongod가 필요하다 — `*.integration.test.ts`.

## 경계

HTTP status·응답 형태를 여기서 정하지 않는다 — `AppError`를 throw하고, 번역은 `src/boundary.ts`가 한다. 상세는 `docs/architecture/error-handling.md`.

순수 계산은 여기 두지 않는다 — 가격 공식·날짜 계산처럼 DB가 필요 없는 로직은 `src/core/domain/`으로 내린다. 그래야 mongod 없이 검증된다.
```

### 8.5 빈 섹션

**내용이 없으면 섹션 자체를 생략한다.** "Gotchas: 없음"처럼 쓰지 않는다 — 현재 `src/client/utils/AGENTS.md`가 그렇게 돼 있다.

섹션의 **존재 자체가 신호**가 되게 한다.

### 8.6 기존 AGENTS.md에서 뺄 것

| 뺄 것 | 이유 |
|---|---|
| `## Overview` | 공통 템플릿의 정의 한 줄로 대체 |
| `## Structure` (코드블록 트리) | index 테이블로 대체. 트리는 파일이 늘면 즉시 썩는다 |
| `## Gotchas` (필수에서 제외) | 있을 때만 쓴다. 없는 걸 적지 않는다 |
| `## 관련 문서` | 재구조화하면 전부 썩는다. 루트 `AGENTS.md`의 Cross-cutting References가 단일 소스 |

**단, PR #65 같은 실제 사고 이력은 살린다.** 규칙의 정당성을 판정할 근거가 되기 때문이다. 위치는 그 규칙을 서술하는 산문 안이 낫다 — 별도 섹션보다 규칙 옆에 붙어 있을 때 읽힌다.

---

## 9. 단계

한 번에 하지 마라. 각 단계가 독립적으로 이득을 내고, 중간에 멈춰도 지금보다 낫도록 짰다.

1. `npm i server-only` → 서버 진입점에 `import "server-only"` 추가(**`actions/` 제외 — §4**). **디렉토리 안 건드림.** 번들 사고가 컴파일 에러로 승격 — 작음
2. eslint `import/no-restricted-paths` (현재 경로 기준으로 먼저). 의존성 방향 자동 검증 — 작음
3. `shared/` → `core/`, `client/lib` + `server/lib` → `adapters/`. 순수층 확정, cloudinary 폴더 합침. **원 문제 해결** — 중간
4. `server/{models,services,mongodb}` → `models/` `services/` `db/`. 서버층 평탄화 — 중간
5. `actions` 얇게 → 로직을 services로. **층당 세탁법 1개 완성** — 큼
6. `client/**` + `app/**/_hooks` → `ui/`. 훅 집결, vitest 설정 단순화 — 중간
7. AGENTS.md 전면 재작성 (§8 템플릿 적용) — 중간

**1~2단계만 해도 문제의 절반이 사라진다.** 번들 경계가 문서에서 컴파일러로 옮겨가고, AGENTS.md의 예외 조항 문단들을 지울 수 있다.

3단계 이후는 되돌리기 어렵다. 1~2 하고 한 사이클 살아본 뒤 결정 권장.

---

## 10. 의도적으로 뺀 것

| 뺀 것 | 이유 |
|---|---|
| **`repositories/` 층** | 원 문제(폴더가 세탁법을 못 알려줌)와 무관. Clean Architecture 패키지에 딸려 왔던 것. ORM 위 repository는 업계에서도 논쟁 중이고(mongoose Model이 이미 repository), 이 프로젝트에서 값어치가 나는 건 `payment`/`product` 둘뿐. 필요해지면 층이 아니라 **그 도메인 파일 하나로** 추가 |
| **`db/helpers.ts`** | `toObjectId`·`serialize`는 순수 함수라 `db/` 폴더에 두면 "폴더당 테스트 전략 1개"가 깨진다(`connect.ts`는 integration, helpers는 unit). 중복 3~4번 없애자고 층 규칙을 깨는 건 손해. **`db/`는 `connect.ts` 하나만** |
| **`.io.ts` 접미사** | 보편 아님. 채택 사례 거의 없음. 층 분리가 같은 답을 준다 |
| **`client/utils/` 층** | `adapters/deeplink/`로 흡수. "SDK를 감싸나"보다 "프로세스 밖으로 나가나"가 더 유용한 기준 |
| **rich domain model** | mongoose 문서는 데이터만 담는 anemic model. 별도 도메인 클래스를 만들면 매핑 코드가 두 배. 이 규모에 값 안 나옴. `core/domain/`에 **순수 계산만** 빼는 절충 |

---

## 11. 확인된 사실 (재조사 불필요)

- Next.js **16.2.10**, ESLint 9 flat config (`eslint.config.mjs`)
- `client-only` 설치됨(transitive). **`server-only`는 미설치** → `npm i server-only` 필요
- `src` 어디에도 `server-only`/`client-only` import 없음
- **`eslint-plugin-import`는 이미 등록됨** (`eslint-config-next/core-web-vitals`가 `import` 플러그인 등록 — 확인 완료). `import/no-restricted-paths` 신규 의존성 0
- `dependency-cruiser` 미설치. 지금은 불필요 — 순환 참조가 실제 문제가 되면 그때
- Next 16 공식 문서가 DAL + `server-only` 권장 — `node_modules/next/dist/docs/01-app/02-guides/data-security.md:56,245`
- **`actions/`에 `server-only`를 넣으면 빌드가 깨진다** — `"use server"`와 양립 불가.
  단계 1 시도에서 실증됨. `"use client"` 컴포넌트 다수가 `@/server/actions`를 import한다
  (`LoginForm`, `SignupForm`, `CheckoutForm`, `ProductLikeBadge`, `ProductViewTracker` 등)
- `src/server/actions`: `.test.ts` 24개 + `.integration.test.ts` 3개
- `src/server/services/guestbook.service.ts`: 비즈니스 로직 0. 전부 쿼리 + 매핑
- `src/server/services/payment.service.ts` (539줄): PortOne SDK 인스턴스 + DB 쿼리 + 상태 전이 규칙 공존. `mongoose.connection.transaction()` 3블록. `order.save({ session })` — **Active Record 스타일**
- `route.ts`가 service를 건너뛰고 Model을 직접 쓰는 곳 **없음** (층 위반 없음)
- `shared/utils/seoul-open-api.ts`는 fetch 안 함. 순수 파서 (위반 아님)
- `shared/utils/image-processor.ts`는 `uploadFn` 주입받는 순수 함수 (위반 아님)
- 에러 처리 규약은 이미 정립됨 — `docs/architecture/error-handling.md`. services는 `AppError` throw + HTTP 모름, `boundary.ts`가 번역. **재구조화가 이 규약을 바꾸면 안 된다**

## 12. 갱신 대상 문서

- `docs/validation/testing-classification.md`, `test-infrastructure.md` — 경로 전면 갱신
- `docs/architecture/data-access.md`, `error-handling.md` — 경로 참조 갱신
- `docs/conventions/type-imports.md` — 배럴 정책. `adapters/cloudinary` 배럴 금지 반영
- `src/**/AGENTS.md` 전부 — §8 템플릿으로 재작성. 폴더가 없어지거나 정의가 바뀜
- `AGENTS.md` (루트) — Cross-cutting References 경로 + §8.1 서식 규칙 추가

## 13. 미결정

- `boundary.ts` 위치 — `src/boundary.ts`(제안) vs 별도 폴더. route.ts와 actions 양쪽이 쓰는 controller 공용 인프라라 마땅한 집이 없다
- `ui/components/`의 atomic design(atoms/molecules/organisms/templates) 유지 여부 — 이번 재구조화와 독립된 별건
- `app/**/_components` 개별 판정 — "재사용 2곳 이상이면 `ui/components/`" 기준을 실제 파일에 적용해야 함
- `cn` 이동 시 import 경로 일괄 갱신 범위 (사용처 많음)
- 3단계 이후를 실제로 할지
