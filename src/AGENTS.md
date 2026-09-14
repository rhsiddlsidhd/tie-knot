# src/

> Last updated: 2026-09-15

## Overview

앱 코드 루트 — 폴더 횡단 컨벤션(import 경로, 상태관리 계층) 전담.

## Key Files

| File          | Purpose                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `proxy.ts`    | 인증/권한 기반 라우트 접근 제어(로그인 필요 경로, 어드민 role 체크, 로그인 유저의 auth 페이지 차단) |
| `boundary.ts` | Route Handler/Server Action 공용 에러 응답 경계 — AppError를 HTTP status로 매핑, 민감 메시지 마스킹 |

## Critical Convention

- Server Action의 인증/권한 검증을 Proxy에 위임하지 않는다 — 렌더링 시점 접근 제어는 애초에 보안 경계가 아니다(UI 없이 동일 오리진에서 같은 POST 요청을 직접 보낼 수 있다), 그래서 각 Server Action 내부에서 세션/역할을 반드시 재검증한다.
- matcher 없이 Proxy를 배포하지 않는다 — 공식 문서: matcher가 없으면 정적 파일(`_next/static`)·이.미지 최적화(`_next/image`)·`public/` 자산까지 모든 요청에서 실행돼, 의도치 않게 CSS/JS/이미지 로딩을 막을 수 있다
- Proxy 안에서 느린 데이터 페칭(외부 API 호출 등)을 하지 않는다 — 공식 문서: Proxy는 느린 데이터 페칭 용도가 아니며, 세션 관리·인가의 전체 솔루션으로 쓰여서도 안 된다(낙관적 체크 용도로만).
- 프로젝트당 두 번째 proxy 파일을 만들지 않는다 — 공식 문서: 프로젝트당 `proxy.ts` 단 하나만 지원한다. 로직을 나누고 싶으면 별도 모듈로 쪼갠 뒤 그 안에서 import해서 조립한다.
- **`src/` 안에 배럴(`index.ts`/`index.tsx`)을 만들지 않고, 디렉터리를 가리키는 import도 쓰지 않는다 — 심볼이 실제로 정의된 파일을 지정한다**(`@/services/auth`, `@/models/user.model`). 모듈 그래프가 심볼이 아니라 모듈 단위로 계산되므로, 배럴은 쓰지 않는 형제 모듈까지 그래프에 끌어들여 `vitest related`·`--changed`·watch·mutation 도구를 무력화한다. 근거와 측정값은 `docs/decisions/0004-explicit-module-paths-over-barrels.md` 참고. `npm run lint:barrels`가 CI에서 이를 강제한다 — 배럴이 없으면 디렉터리 지정 import는 모듈 해석 단계에서 실패하므로 `npm run tsc`가 함께 잡는다.
- **`src/` 안 파일은 `export default`를 쓰지 않는다 — 전부 named export로 짓는다.** 단 `src/app/`의 Next.js 라우트 파일은 프레임워크가 `export default`를 강제하므로 예외이며, 대상 파일 목록은 `src/app/AGENTS.md`를 따른다.
- **named export는 선언과 분리해 파일 하단의 list로 모은다**(`const X = ...; export { X };`). Next.js가 build-time에 직접 분석하는 route segment config와 `proxy.ts`의 `config`만 `export const`를 유지한다. `no-restricted-syntax`가 저장소 전역에서 강제하며 근거와 예외는 `docs/decisions/0009-project-wide-list-style-named-exports.md`를 따른다.
- 폴더의 공개 API를 재수출 목록으로 선언하지 않는다 — 무엇을 외부에서 써도 되는지는 각 계층 `AGENTS.md`의 역할 경계가 규정한다.
- **`boundary.ts`가 Route Handler용 `NextResponse` 변환과 Server Action용 반환 오류 변환을 함께 소유하는 것은 `src/` 루트의 명시적 예외다** — 역할로는 둘이지만 "AppError를 바깥 세계 표현으로 번역"이라는 개념 하나이고 `ERROR_STATUS_MAP`·마스킹 정책을 공유한다. 프레임워크 Adapter와 Action 경계로 쪼개면 그 공유 상태를 어디 둘지가 새 문제로 남으므로 분할하지 않는다.
- 로컬 상태로 충분한 걸 곧바로 Context나 Zustand로 확장하지 않는다 — 클라이언트 상태 범위는 로컬 → Context API(`src/ui/context/`) → Zustand(`src/ui/stores/`) 순으로만 넓힌다.
- 서버에서 온 데이터를 Context/Zustand로 직접 옮기지 않는다 — 캐싱·중복 호출 방지는 `useSWR`(주로 `src/ui/hooks/`의 훅 안에서 Zustand 구독과 함께 조합)이 전담한다.
- **구현체 하나가 2곳 이상의 구체적 소비처에서 쓰이면, 이름에 그 소비처 중 하나를 특정하지 않는다** — 특정하면 그 이름이 다른 소비처 입장에선 의미가 맞지 않게 된다.
- **식별자 케이스는 역할을 먼저 판정한다** — 타입/인터페이스/클래스와 컴포넌트·Context·Provider·Schema·Model은 PascalCase, 함수와 훅은 camelCase다. 훅은 `use` 바로 다음 문자를 대문자로 짓는다(`useAuth`). 더 구체적인 역할 규칙이 있는 하위 `AGENTS.md`가 이 공통 규칙보다 우선한다.
  - Next.js·React 등 프레임워크가 이름으로 API를 인식하는 export는 프레임워크가 요구한 원형을 유지하고 일반 케이스 규칙에서 제외한다(`dynamic`, `revalidate`, `maxDuration`, `GET`, `POST` 등).
  - 그 밖의 `const` 중 **선언 위치와 관계없이 실행 흐름·입력에 따라 달라지지 않고, 소비자가 변경하지 않는 설정·정책·기준값과 그 결정적 파생값**은 SCREAMING_SNAKE_CASE로 짓는다. 리터럴·계산식·환경변수 참조·함수 호출 중 어떤 초기화식을 썼는지는 상수 판정 기준이 아니다.
  - SCREAMING_SNAKE_CASE 객체·배열은 바인딩뿐 아니라 내부 값도 변경하지 않는다. 가능한 경우 `as const` 또는 `Readonly` 타입으로 불변성을 구조적으로 표현하고, 속성 대입·`push` 등 mutation을 금지한다.
  - 실행 흐름·입력과 무관하게 UI의 선택지·필드·라벨·표시 방식을 정의하는 정적 구성 데이터는 SCREAMING_SNAKE_CASE로 짓는다. props·API·권한·locale 등에 따라 계산한 UI 데이터는 camelCase로 짓는다.
  - 요청·사용자·함수 호출마다 달라지는 결과, 지역 계산값, 런타임 상태의 초기값·seed·template, 테스트 fixture·mock·sample·expected 데이터, 가변 상태, accumulator, 캐시 및 런타임 리소스는 `const`로 선언해도 camelCase로 짓는다. 테스트 timeout·고정 경로·환경 설정처럼 테스트 실행 자체의 정책인 값만 SCREAMING_SNAKE_CASE로 짓는다.
  - 판정할 때는 "이 값을 바꾸면 애플리케이션의 공통 설정·정책·판단 기준이 바뀌는가"를 확인한다. 맞으면 상수 후보이고, 현재 실행의 결과나 작업 상태만 바뀌면 일반 변수다. 상세 판정 기준과 예시는 `docs/conventions/identifier-naming.md`를 따른다.
- 같은 아티팩트 타입끼리 파일명 케이스가 겹치지 않게 짓는다 — 파일명만 보고 컴포넌트인지 훅인지 유틸인지 구분할 수 있어야 한다.
- `{목적}` 기반 파일(도메인 무관 범용 카테고리 — `utils/`, `constants/{목적}.ts`, `hooks/use{목적}.ts`, `services/{목적}.ts`, `schemas/{목적}.schema.ts` 등)에는 도메인/라우트가 드러나는 이름을 쓰지 않는다 — 이름이 도메인에 종속되면 재사용 가능 범위를 파일명만으로 오판하게 된다(예: `postsFormatter.ts` 금지).
