# 검증 체계

이 디렉터리는 검증 결정 기준과 운영 지식의 Single Source of Truth다. 가드레일과 설정은 규칙을 자동 판정하고, 이 문서들은 그 규칙을 언제·왜 적용하는지 설명한다. 실행 명령과 자동 판정 값은 문서에 복제하기보다 `package.json`과 각 설정을 따른다.

## 상황별 문서 지도

| 상황                                              | 먼저 읽을 문서                           | 답하는 질문                                          |
| ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| 테스트 종류·이름·위치를 정할 때                   | [테스트 분류](testing-classification.md) | unit, integration, E2E 중 무엇이며 어디에 둘 것인가? |
| 테스트를 작성하거나 고칠 때                       | [테스트 작성 원칙](testing-practices.md) | 무엇을 assertion하고 무엇을 mock할 것인가?           |
| Vitest project, DB, jsdom, factory를 바꿀 때      | [테스트 인프라](test-infrastructure.md)  | 실행 환경과 공유 자원에는 어떤 제약이 있는가?        |
| 제품 코드를 TDD로 변경하거나 Guard가 막을 때      | [TDD Guard](tdd-guard.md)                | Red/Green proof를 어떻게 만들고 진단하는가?          |
| mutation을 실행하거나 survived mutant를 처리할 때 | [Mutation testing](mutation-testing.md)  | changed/full 실행의 목적과 통과 조건은 무엇인가?     |
| CI 또는 브랜치 보호를 바꿀 때                     | [CI gates](ci-gates.md)                  | 어떤 자동 검증이 어디서 필수인가?                    |

공개 스크립트의 내부 책임과 진입점은 [스크립트 안내](../../scripts/README.md)를 참고한다.
