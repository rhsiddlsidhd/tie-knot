# Scripts

실행 목적별 보조 스크립트와 공개 진입점을 관리한다.

| 경로 | 책임 | 공개 진입점 |
| --- | --- | --- |
| `e2e/` | Playwright 애플리케이션 실행 환경 | `node scripts/e2e/server.mjs` |

`commands`, `reporters`, `schemas`는 실제로 분리할 구현이 생기기 전에는 만들지 않는다.

## 공개 npm 명령

| 목적 | 명령 |
| --- | --- |
| 애플리케이션 | `dev`, `build`, `start` |
| 정적 검증 | `lint`, `tsc`, `build` |
| 테스트 묶음 | `test`, `test:unit`, `test:integration:client`, `test:integration:server`, `test:e2e`, `test:e2e:portone` |

제거된 TDD proof, mutation, coverage, `check` 명령은 현재 계약이 아니다.
