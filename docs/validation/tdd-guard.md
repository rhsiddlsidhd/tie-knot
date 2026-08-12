# TDD Guard

TDD Guard는 테스트와 제품 코드 변경을 연결해 Red → Green → mutation 검증 순서를 확인하는 공통 가드레일이다. 정책 판정은 `scripts/tdd-guard/core/`에 있고, npm 명령·에이전트 Hook·CI는 `scripts/tdd-guard/bin/guard.mjs`를 공통 진입점으로 사용한다.

## 로컬 흐름

1. 변경할 제품 코드와 연결된 테스트를 먼저 수정한다.
2. 테스트 범위에 맞춰 `npm run test:red -- --scope unit` 또는 `npm run test:red -- --scope integration`을 실행한다.
3. Red proof가 만들어지면 허용된 제품 코드를 구현한다.
4. 같은 범위로 `npm run test:green -- --scope <scope>`을 실행한다.
5. 필요한 mutation 검증을 완료한 뒤 `npm run tdd:verify`를 실행한다.

현재 proof 상태는 `npm run tdd:status`로 확인한다. 테스트 파일이나 Guard 설정이 달라지면 기존 proof는 더 이상 유효하지 않을 수 있다.

## 차단 기준

- 변경된 테스트가 없거나 지정한 `unit`·`integration` 범위와 맞지 않으면 Red/Green proof를 만들지 않는다.
- 테스트 품질 검사에 실패하면 Red proof를 만들지 않는다.
- 유효한 proof가 없거나 proof가 허용하지 않은 제품 파일은 Hook에서 편집을 차단한다.
- Green 결과나 필요한 mutation 상태가 충족되지 않으면 최종 검증을 완료하지 않는다.

구체적인 파일 분류와 proof 상태 판정은 `scripts/tdd-guard/core/` 구현을 단일 소스로 삼는다.

## CI 검증

PR CI는 `node scripts/tdd-guard/bin/guard.mjs verify --ci`를 호출한다. CI 정책은 변경 범위와 기준 브랜치를 바탕으로 필요한 테스트 변경이 포함됐는지 검증하며, 로컬 proof 파일을 CI 성공의 근거로 사용하지 않는다.

## 문제 확인

1. `npm run tdd:status`로 proof 상태와 무효화 이유를 확인한다.
2. `node scripts/tdd-guard/bin/guard.mjs classify <파일>`로 파일 분류와 필요한 테스트 범위를 확인한다.
3. `node scripts/tdd-guard/bin/guard.mjs affected`로 변경된 제품 파일에 연결된 테스트를 확인한다.
4. 테스트 작성 규칙 문제라면 [테스트 가이드라인](testing-guideline.md)을 확인한다.

명령 구현과 공개 진입점 목록은 [스크립트 안내](../../scripts/README.md)를 참고한다.
