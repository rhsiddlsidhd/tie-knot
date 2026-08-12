# TDD Guard

TDD Guard는 테스트와 제품 코드 변경을 연결해 Red → Green → mutation 순서를 강제한다. 정책 판정은 `scripts/tdd-guard/core/`, npm·에이전트 Hook·CI의 공통 진입점은 `scripts/tdd-guard/bin/guard.mjs`다. 테스트 종류를 고를 때는 [테스트 분류](testing-classification.md)를 따른다.

## 로컬 흐름

1. 변경할 동작의 테스트를 먼저 수정한다.
2. `npm run test:red -- --scope unit` 또는 `npm run test:red -- --scope integration`으로 새 assertion 실패를 증명한다.
3. proof가 허용한 제품 파일을 구현한다.
4. 요구된 각 범위에서 `npm run test:green -- --scope <scope>`을 실행한다.
5. `npm run test:mutation`으로 changed mutation proof를 만든다.
6. `npm run tdd:verify`로 모든 Green 범위와 mutation proof를 확인한다.

현재 proof 상태는 `npm run tdd:status`로 확인한다. proof는 HEAD, 제품·테스트 diff, Guard 설정, 에이전트 세션에 묶인다. 이 중 하나가 바뀌면 다시 증명해야 한다.

## 차단 기준

- 변경된 테스트가 없거나 지정한 범위와 맞지 않으면 proof를 만들지 않는다.
- 환경·설정·import·timeout 오류, 이미 존재하던 실패, 제품 코드와 연결되지 않은 테스트, 품질 검사에 실패한 테스트는 Red proof가 아니다.
- 유효한 proof가 없거나 proof가 허용하지 않은 제품 파일은 pre-edit Hook에서 차단한다.
- 테스트 수정은 기존 proof를 무효화하고, 허용된 제품 코드 수정은 상태를 `IMPLEMENTING`으로 바꾼다.
- 요구된 모든 범위의 Green과 현재 변경에 맞는 mutation 결과가 없으면 최종 검증을 완료하지 않는다.

구체적인 파일 분류와 proof 상태 판정은 `scripts/tdd-guard/core/` 구현을 단일 소스로 삼는다.

## CI 검증

PR CI는 `node scripts/tdd-guard/bin/guard.mjs verify --ci`를 호출한다. CI는 merge-base 이후 변경된 guarded 제품 파일마다 그래프로 연결된 테스트가 존재하고 품질 검사를 통과하는지 확인한다. 로컬 proof 파일은 CI 성공의 근거가 아니다. 전체 CI 게이트는 [CI gates](ci-gates.md)를 참고한다.

## 문제 확인

1. `npm run tdd:status`로 proof 상태와 무효화된 hash·session 항목을 확인한다.
2. `node scripts/tdd-guard/bin/guard.mjs classify <파일>`로 guarded 여부와 요구 범위를 확인한다.
3. `node scripts/tdd-guard/bin/guard.mjs affected`로 변경 제품 파일에 연결된 테스트를 확인한다.
4. Red가 거부되면 새 assertion 실패인지, baseline에도 같은 실패가 있는지, 환경 오류인지 확인한다.
5. 편집이 거부되면 대상 파일이 proof의 `allowedProductFiles`에 포함되는지 확인한다.
6. 테스트 자체의 문제는 [테스트 작성 원칙](testing-practices.md), mutation 문제는 [Mutation testing](mutation-testing.md)을 확인한다.

명령 구현과 공개 진입점 목록은 [스크립트 안내](../../scripts/README.md)를 참고한다.
