# ADR-0002: Adapter 런타임 세그먼트

- 상태: Accepted
- 결정일: 2026-08-19
- 적용 범위: `src/adapters/`
- 대체: [ADR-0001](0001-role-based-directory-architecture.md)의 Adapter 런타임 배치 결정

## 맥락

ADR-0001은 `src/`의 최상위 디렉터리가 역할을 표현하고 런타임은 `server-only`와 `client-only` 표식으로 검증하도록 결정했다. 이 원칙은 유지한다.

그러나 외부·런타임 경계 전용인 `adapters/`에서는 서비스별 폴더가 실행 환경까지 안정적으로 예측하게 한다. 기존 아홉 폴더 중 여덟 폴더는 이미 단일 런타임이었고, Cloudinary만 서버와 브라우저 구현을 함께 담았다. 이 혼합 때문에 Vitest가 브라우저 테스트를 파일명으로 열거해 Node project에서 제외했으며, 열거에서 빠진 브라우저 테스트가 잘못된 환경에서 조용히 수집됐다.

## 결정

`src/adapters/`에 한해 역할 아래에 런타임 세그먼트를 둔다.

```text
src/adapters/
├── server/{경계}/
└── browser/{경계}/
```

Adapter의 새 불변식은 **폴더 하나 = 런타임 하나**다. Cloudinary 서버 구현과 브라우저 구현도 각각 `server/cloudinary/`와 `browser/cloudinary/`로 분리한다. 각 모듈의 `server-only` 또는 `client-only` 표식은 경로와 별개의 production build 가드로 계속 유지한다.

Vitest는 서버 Adapter를 Node `unit` project에서, 브라우저 Adapter를 jsdom `component` project에서 디렉터리 패턴으로 수집한다. 개별 Adapter 테스트 파일명을 예외 목록에 추가하지 않는다.

## 검토한 대안

### 표식만 유지

Next.js의 주류 방식은 디렉터리보다 `"use client"`, `server-only`, `client-only` 같은 표식으로 런타임 경계를 나타내는 것이다. 프레임워크가 잘못된 소비 그래프를 production build에서 차단한다는 장점이 있다.

하지만 표식만으로는 Vitest의 실행 환경 선택에 사용할 안정적인 경로가 생기지 않는다. 파일명 열거는 새 브라우저 Adapter 테스트가 추가될 때 누락될 수 있고, 이번에도 실제 누락을 감지하지 못했다. 따라서 표식은 가드로 유지하되 Adapter에 한해 경로에도 런타임을 표현한다.

### 서비스 폴더 아래에 런타임 배치

`cloudinary/server/`, `cloudinary/browser/`처럼 서비스 응집성을 먼저 보존할 수 있다. 그러나 Vitest가 런타임별 테스트를 한 패턴으로 수집할 수 없고, 모든 Adapter 폴더를 탐색하거나 예외로 관리해야 한다. 런타임 경계가 Adapter의 실행·검증 방식을 결정하므로 런타임 세그먼트를 먼저 둔다.

### 브라우저 테스트에 환경 주석 추가

각 테스트에 jsdom 환경 주석을 선언하면 현재 오수집은 고칠 수 있다. 하지만 새 파일마다 선언을 반복하며 누락 시 조용히 Node에서 수집되는 구조는 남는다. 디렉터리 기반 Vitest project 선택이 더 단순한 기본값이므로 기각한다.

## 결과와 가드

Adapter import 경로만 보고 런타임을 알 수 있고, Vitest 설정에서 브라우저 파일명 예외가 사라진다. 서비스 폴더가 단일 런타임이므로 Cloudinary 배럴을 금지했던 근거도 사라진다. 배럴 생성 여부는 각 경계의 공개 API 크기에 따라 결정한다.

경로와 표식이 서로 어긋날 가능성은 남는다. 현재는 다음 가드로 관리한다.

- `server/**` 제품 모듈은 `server-only`, `browser/**` 제품 모듈은 `client-only`를 선언한다.
- Vitest project는 런타임 세그먼트별 glob으로 테스트 환경을 선택한다.
- production build가 잘못된 런타임 소비 그래프를 차단한다.
- 별도 자동 일치 검사기는 도입하지 않으며, 누락이 반복되면 후속 Issue에서 검토한다.

## 관련 이력

- 역할 기반 구조 도입: [ADR-0001](0001-role-based-directory-architecture.md)
