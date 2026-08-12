# CI gates

`.github/workflows/tdd.yml`은 `dev` 대상 pull request와 수동 실행에서 검증 게이트를 제공한다. 정확한 job 이름, matrix, 명령, timeout은 workflow를 단일 소스로 삼는다.

## Pull request 게이트

| 게이트               | 책임                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `static`             | ESLint, TypeScript typecheck, production build                               |
| `unit-*`             | 영역별 unit shard 실행                                                       |
| `unit`               | 모든 unit shard 성공을 집계                                                  |
| `integration-client` | jsdom client integration                                                     |
| `integration-server` | MongoDB를 사용하는 server와 app integration                                  |
| `e2e-core`           | Chromium에서 핵심 사용자 시나리오                                            |
| `mutation-changed`   | `origin/dev` 대비 변경 제품 줄의 survived mutant 차단                        |
| `tdd-policy`         | Guard 자체 테스트, unit shard 구성 검증, 변경 제품과 관련 테스트의 정책 검증 |

정적 검증은 build 과정에서 필요한 MongoDB binary cache와 테스트용 환경을 사용하지만 실제 외부 결제·메일 서비스에 연결하지 않는다.

## 정기·수동 게이트

- `.github/workflows/full-mutation.yml`은 `dev` 전체 mutation을 정기 또는 수동 실행한다. 결과 추세와 미검사 영역을 관측하며 PR 필수 체크가 아니다.
- `.github/workflows/portone-smoke.yml`은 별도 self-hosted runner와 보호된 환경 secret이 필요한 수동 smoke test다. 실제 PortOne KG Inicis 흐름의 표시와 연동을 확인하며 일반 PR에서 자동 실행하지 않는다.

## 브랜치 보호

GitHub 브랜치 보호는 `dev`와 `main` 모두 TDD workflow가 내는 정적, unit shard·집계, integration, E2E, changed mutation, policy 체크를 필수로 요구한다. 두 브랜치 모두 최신 기준 브랜치 반영, 관리자 포함 적용, 선형 히스토리, 대화 해결을 요구하며 force-push와 삭제를 허용하지 않는다.

저장소 workflow의 `pull_request.branches`는 현재 `dev`만 포함한다. 따라서 기능 브랜치는 `dev` PR에서 필수 체크를 만든 뒤 승격해야 한다. `main`으로 직접 PR하는 운영을 도입하려면 보호 규칙만 복제해서는 안 되며, 같은 체크가 `main` 대상 PR에서도 실제 생성되도록 workflow trigger와 changed mutation 기준 브랜치를 함께 설계해야 한다.

브랜치 보호는 GitHub 저장소 설정이므로 문서만으로 강제되지 않는다. workflow job 이름을 바꾸거나 추가·삭제할 때는 `dev`와 `main`의 required status checks도 같은 변경에서 동기화하고, 새 PR에서 체크가 실제 생성되는지 확인한다.
