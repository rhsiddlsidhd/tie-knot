# ADR-0007: 컴포넌트 디렉토리 단일 재수출 배럴 예외

- 상태: Accepted
- 결정일: 2026-09-14
- 적용 범위: `src/ui/components/{molecules,organisms,templates}/`

## 맥락

`molecules`/`organisms`/`templates` 티어는 `{Component}.tsx`와 `{Component}.component.test.tsx`가 같은 폴더에 flat하게 나열돼 있었다. 이 둘을 컴포넌트별 디렉토리(`Alert/Alert.tsx`, `Alert/Alert.component.test.tsx`)로 묶는 레이어를 도입하면서, 소비자가 파일을 직접 지정(`.../Alert/Alert`)할지 디렉토리 하나당 배럴 하나(`.../Alert/index.ts` → `.../Alert`)를 둘지가 갈렸다.

[ADR-0004](0004-explicit-module-paths-over-barrels.md)는 `src/` 전역에서 배럴을 금지했다. 근거는 `export *`로 여러 모듈을 한 배럴에 묶으면 심볼 하나만 가져와도 배럴 파일이 평가되며 재수출 대상 전부가 모듈 그래프에 끌려 들어온다는 실측(`vitest related` 466배 차이)이었다. 그 결정은 "일부 폴더만 배럴 허용"안을 검토했으나, 어떤 폴더가 무해한지 판정이 사람의 재분류에 남고 시간이 지나면 조용히 거짓이 될 수 있다는 이유로 기각했다.

컴포넌트별 디렉토리는 실질 모듈이 컴포넌트 파일 하나뿐이고, 같은 폴더의 테스트 파일은 배럴이 재수출할 대상이 아니다. 배럴이 정확히 그 파일 하나만 재수출하도록 강제할 수 있다면 ADR-0004가 측정한 증폭 경로 자체가 성립하지 않는다.

## 결정

컴포넌트별 디렉토리 안에서는 `index.ts`를 예외로 허용한다. 이 배럴은 같은 디렉토리의 동일한 이름을 가진 컴포넌트 파일 하나만, 정확히 한 문장으로 `export { X } from "./X"` 형태로 재수출한다. 값과 타입을 같이 내보내야 하면(`@typescript-eslint/consistent-type-exports`) 인라인 `type` 한정자로 같은 문장에 묶는다 — `export { X, type Y } from "./X"`(ADR-0008). 문장을 두 개로 쪼개는 것(`export {}`와 `export type {}` 분리), `export *`, 다른 경로로의 재수출, 그 밖의 로직은 담지 않는다. 이 불변식은 `scripts/check-no-barrels.mjs`가 배럴 내용을 파싱해 기계적으로 검사하고 위반 시 CI를 실패시킨다 — ADR-0004가 요구한 "도구로 강제되는 경계 하나"를 그대로 만족한다.

컴포넌트별 디렉토리 레이어 자체는 `scripts/check-component-tier-shape.mjs`가 강제한다 — molecules/organisms/templates 티어 루트에 `.ts`/`.tsx` 파일이 서브디렉토리 없이 직접 있으면 실패한다. 배럴 예외와 디렉토리 레이어 강제는 서로 다른 불변식이라 별도 스크립트로 분리했다.

## 검토한 대안

### 직접 파일 import 유지 (배럴 없음)

디렉토리 레이어만 추가하고 `@/ui/components/molecules/Alert/Alert`처럼 파일을 직접 지정한다. ADR-0004를 전혀 건드리지 않는 가장 단순한 안이지만, 디렉토리명과 파일명이 매 import마다 중복되고(`Alert/Alert`) 컴포넌트를 지정할 때 폴더 내부 파일명을 다시 확인해야 하는 마찰이 남는다.

### 폴더 단위 전면 허용 (ADR-0004 폐기)

배럴을 다시 전역 허용한다. 992건의 import를 재작성해 얻은 검사 가능성이 통째로 사라지고 466배 차이가 재발한다. 기각.

## 결과

소비자는 `@/ui/components/molecules/Alert`로 짧게 import한다. 배럴이 정확히 한 파일만 가리키는 한 모듈 그래프 증폭은 발생하지 않으며, 이 불변식이 깨지면(두 번째 export 추가, `export *` 사용 등) `lint:barrels`가 즉시 실패해 ADR-0004가 우려한 "조용한 침식"을 도구가 대신 감시한다. 잔여 위험은 검사 스크립트가 못 잡는 우회(배럴이 아닌 다른 파일에서 새 재수출 체인을 만드는 것)이며, 이는 `src/AGENTS.md`의 배럴 금지 규칙과 코드 리뷰가 가드한다. 이 예외는 `src/ui/components/{molecules,organisms,templates}/` 밖으로 확장하지 않는다 — 확장하려면 대상 폴더가 "디렉토리당 실질 모듈 하나"라는 전제를 만족하는지 새로 검토해야 한다.

## 관련 이력

- [ADR-0004](0004-explicit-module-paths-over-barrels.md)
