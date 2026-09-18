# ADR-0009: 저장소 전역 list 스타일 named export 강제

- 상태: Accepted
- 결정일: 2026-09-14
- 적용 범위: ESLint가 검사하는 저장소의 JavaScript·TypeScript 모듈
- 대체: [ADR-0008](0008-list-style-named-exports.md)의 컴포넌트 한정 범위

## 맥락

ADR-0008은 컴포넌트 티어의 공개 API를 한눈에 확인하기 위해 list 스타일 named export를 `src/ui/components/`에만 강제했다. 같은 저장소의 actions·services·core·라우트 로컬 모듈과 테스트 지원·개발 도구는 의미가 같은 inline export를 계속 사용해, 디렉터리에 따라 공개 API 위치가 달라지는 혼재가 남았다.

저장소를 전수 검사하면 컴포넌트 티어 밖 299개 파일의 620개 inline named export를 list 스타일로 옮길 수 있다. 그러나 Next.js 16.2.10의 build-time 정적 분석기는 route segment config와 Proxy matcher config의 값을 직접 export한 const 선언에서만 추출한다. 이 선언을 일반 list export로 바꾸면 설정을 인식하지 못하고 기본값을 쓰므로, 모든 named export를 문법적으로 동일하게 만드는 것은 동작 보존과 양립하지 않는다.

## 결정

ESLint가 검사하는 JavaScript·TypeScript 모듈의 일반 named export는 선언과 분리해 파일 하단의 list에 모은다. 값과 타입을 함께 내보내면 `export { X, type Y };`처럼 한 목록에 적는다. `eslint.config.mjs`의 전역 `no-restricted-syntax`가 이 불변식을 강제한다.

Next.js가 build-time에 값을 추출하는 route segment config와 `src/proxy.ts`의 `config`는 직접 선언 export를 유지한다. ESLint 예외는 해당 파일 패턴과 Next.js가 지원하는 설정 식별자를 함께 제한해, 같은 파일의 일반 함수·타입·상수가 예외에 섞이지 않게 한다. HTTP 메서드, metadata, `generateStaticParams`, `proxy`처럼 모듈 export 자체로 인식되거나 list export를 명시적으로 지원하는 API는 예외로 두지 않는다.

## 검토한 대안

### 컴포넌트 범위 유지

변경량이 없다는 장점이 있지만, 같은 언어와 저장소 안에서 디렉터리별 export 위치가 달라지는 원래 문제가 남는다. 공개 API 탐색 규칙을 하나로 만들지 못해 기각.

### `src/`만 확장

제품 코드의 일관성은 얻지만 테스트 지원 코드와 개발 도구에 별도 문법을 허용한다. ESLint 코어 규칙은 타입 정보 없이 같은 기준을 적용할 수 있어 범위를 나눌 이유가 없으므로 기각.

### Next.js 파일 전체 제외

프레임워크 정적 분석 회귀를 넓게 피할 수 있지만, Route Handler의 HTTP 메서드와 라우트 파일의 일반 named export까지 불필요하게 혼재를 허용한다. 예외가 필요한 설정 선언만 식별자로 제한할 수 있어 기각.

### 예외 없는 전역 list 스타일

문법은 완전히 통일되지만, route segment의 캐시·런타임 설정과 Proxy matcher가 조용히 기본값으로 대체될 수 있다. 스타일보다 런타임 의미 보존이 우선이므로 기각.

## 결과

저장소 어디서나 파일 하단에서 공개 API를 확인할 수 있고 새 inline export는 lint에서 차단된다. 기존 299개 파일을 기계적으로 바꾸는 큰 diff와 선언마다 export 목록이 추가되는 비용이 생긴다. 선언과 export의 결합 방식만 바뀌므로 ESM 바인딩과 소비자 import는 유지된다.

잔여 위험은 Next.js가 정적 분석 대상 설정을 추가하거나 list export 지원 범위를 바꾸는 경우다. 설치 버전의 `node_modules/next/dist/docs/`와 build 분석 구현을 확인하고, `npm run build`에서 route segment 설정·Proxy matcher 경고가 없는지 검증하는 것으로 가드한다.

## 관련 이력

(없음)
