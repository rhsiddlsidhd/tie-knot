# 테스트 작성 원칙

테스트는 구현 세부가 아니라 계층의 공개 계약과 실패 의미를 구체적으로 검증한다. 종류와 배치는 [테스트 분류](testing-classification.md), 실행 환경은 [테스트 인프라](test-infrastructure.md)를 따른다.

## Assertion

- 존재 여부만 확인하는 `toBeDefined()`·`toBeTruthy()`보다 `toBe()`·`toEqual()`·`toMatchObject()`로 값과 의미를 명시한다.
- 조회·판별 service에서 “없음”이 정상 흐름이면 `null`을 검증한다.
- 필수 존재·인가 확인 service는 `AppError` 여부뿐 아니라 `category`까지 검증한다. service는 HTTP status를 모르므로 status mapping은 route 경계에서 검증한다.
- Server Action의 예상 가능한 실패는 throw가 아니라 반환 계약이다. `success`, `category`, `message`, `fieldErrors` 등 실제 반환값을 검증한다.
- Red는 새 assertion 실패여야 한다. import, 설정, timeout 같은 환경 오류나 기존 실패는 동작 부재의 증거가 아니다.

## Mocking

- Cloudinary, PortOne, 이메일 등 네트워크·비용·외부 부작용이 있는 연동은 mock한다.
- Mongoose model은 mock하지 않고 `mongodb-memory-server`에서 실제 쿼리를 실행한다. 필터, 변환 결과, schema 계약은 model mock으로 검증할 수 없다.
- bcrypt와 jose처럼 외부 I/O가 없는 로컬 연산은 실제로 실행한다.
- mock 대상은 제품 코드가 import하는 배럴 경로와 일치시킨다. 일부 export만 바꿀 때는 나머지 구현을 보존하는 partial mock을 사용한다.

## 계층별 원칙

- service는 입력·출력, DB 효과, 도메인 오류 분류를 검증한다.
- action은 입력 검증, 유스케이스 service 위임, 반환 계약과 캐시 갱신만 검증한다. bcrypt·Cloudinary·DB 같은 service 내부 구현을 action 테스트에서 중복 검증하지 않는다.
- route는 HTTP status와 응답 envelope 같은 HTTP 경계 고유 계약을 검증한다.
- molecule은 props→출력과 단일 상호작용을, organism은 여러 상호작용이 로컬 UI 상태를 거치는 흐름까지 검증한다. 도메인 로직은 해당 컨테이너나 service의 책임이다.
- 컴포넌트 하위 트리를 mock하지 않고 렌더링한다. 접근 가능한 쿼리를 우선하고 `data-testid`는 다른 방법이 없을 때만 쓴다.
- 사용자 상호작용은 `fireEvent`보다 `@testing-library/user-event`를 사용한다.

## 표현과 유지보수

- `describe`와 `it` 제목은 한국어로 작성한다.
- Vitest API는 각 파일에서 명시적으로 import한다. 암묵적 전역을 사용하지 않는다.
- 테스트 데이터는 `testing/support/factories/`의 도메인 factory로 만들고 필요한 값만 override한다.
- 공용 factory와 helper는 `@testing/support` 배럴에서 import한다.
