# CI gates

`.github/workflows/static.yml`은 `dev` 대상 pull request와 수동 실행에서 정적 검증 게이트를 제공한다. 정확한 job 이름, 명령, timeout은 workflow를 단일 소스로 삼는다.

## Pull request 게이트

| 게이트   | 책임                                      |
| -------- | ----------------------------------------- |
| `static` | ESLint, TypeScript 검사, production build |

정적 검증은 별도 테스트 래퍼 없이 `npm run build`를 직접 실행한다. 테스트 스위트는 로컬에서 필요에 따라 실행하며 PR 필수 게이트가 아니다.

## 정기·수동 게이트

- `.github/workflows/portone-smoke.yml`은 별도 self-hosted runner와 보호된 환경 secret이 필요한 수동 smoke test다. 실제 PortOne KG Inicis 흐름의 표시와 연동을 확인하며 일반 PR에서 자동 실행하지 않는다.

## 브랜치 보호

GitHub 브랜치 보호의 필수 상태 체크는 `static` 하나로 맞춘다. `dev`와 `main` 모두 최신 기준 브랜치 반영, 관리자 포함 적용, 선형 히스토리, 대화 해결을 요구하며 force-push와 삭제를 허용하지 않는다.

저장소 workflow의 `pull_request.branches`는 현재 `dev`만 포함한다. 따라서 기능 브랜치는 `dev` PR에서 필수 체크를 만든 뒤 승격해야 한다. `main`으로 직접 PR하는 운영을 도입하려면 같은 체크가 `main` 대상 PR에서도 실제 생성되도록 workflow trigger를 함께 변경해야 한다.

브랜치 보호는 GitHub 저장소 설정이므로 문서만으로 강제되지 않는다. workflow job 이름을 바꾸거나 추가·삭제할 때는 `dev`와 `main`의 required status checks도 같은 변경에서 동기화하고, 새 PR에서 체크가 실제 생성되는지 확인한다.
