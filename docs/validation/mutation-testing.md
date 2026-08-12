# Mutation testing

Mutation testing은 코드가 실행됐는지가 아니라 assertion이 동작 변화를 잡는지를 검증한다. TDD Guard와 같은 `scripts/test-scope/test-graph.mjs` 그래프를 사용하며, `import type`을 제외한 직접·간접 런타임 import로 제품 소스와 관련 테스트를 연결한다.

## Changed mutation

`npm run test:mutation`은 기본적으로 현재 HEAD와 `origin/dev`의 merge-base 이후 바뀐 `src/` 제품 줄만 mutation하고 그래프에서 관련 테스트만 선택한다. CI는 기준을 명시해 같은 명령을 실행한다.

- 생성할 mutant가 없으면 N/A이며 실패가 아니다.
- 하나라도 허용되지 않은 survived mutant가 있으면 실패한다.
- 결과와 변경 대상 hash는 로컬 TDD 최종 검증에 쓰이는 proof로 저장된다.
- 동등 mutant 예외는 `mutation-equivalents.json` 형식과 만료 정책을 통과해야 한다. 영구 면제 수단이 아니다.

## Full mutation

`npm run test:mutation:full`은 그래프에 연결된 전체 `src/` 제품 소스를 incremental mode로 검사한다. 로컬 보고서와 baseline은 XDG state 아래에 유지해 워크트리를 오염시키지 않는다. CI는 `dev`를 대상으로 정기·수동 실행하고 incremental cache, HTML/JSON report artifact, 설정된 경우 Dashboard 결과를 남긴다.

Full mutation의 threshold와 동시성 같은 자동 판정 값은 `stryker.config.mjs`를 따른다. 장기 품질 추세와 미검사 영역을 찾는 게 목적이며 PR 필수 체크는 아니다. PR 차단은 changed mutation이 담당한다.

## Survived mutant 대응

1. changed 실행 로그나 full report에서 파일, 줄, mutator를 확인한다.
2. 원래 동작과 mutant가 외부에서 구별되는 계약인지 판단한다.
3. 구별된다면 존재 확인 수준의 assertion을 구체적인 값·오류 분류·부수효과 검증으로 보강한다.
4. `npm run test:mutation`을 다시 실행해 해당 mutant가 killed인지 확인한다.
5. 의미가 완전히 같은 동등 mutant라면 코드로 제거할 수 있는지 먼저 검토하고, 불가능할 때만 소유자·이유·만료가 있는 예외를 사용한다.

NoCoverage는 관련 테스트가 제품 경로를 실행하지 않는다는 뜻이다. 테스트 분류와 import 그래프 연결부터 확인한다.
