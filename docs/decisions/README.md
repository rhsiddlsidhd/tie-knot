# 아키텍처 결정 기록

ADR(Architecture Decision Record)은 프로젝트에 장기간 영향을 주는 기술적 선택의 맥락, 검토한 대안, 결정과 결과를 보존한다. 현재 적용할 규칙은 `docs/architecture/`, `docs/conventions/`, `docs/validation/`과 코드 가까이의 `AGENTS.md`가 담당한다.

## 상태

- `Proposed`: 검토 중이며 아직 적용 기준이 아니다.
- `Accepted`: 채택되어 현재 또는 기록된 시점의 기준이다.
- `Superseded`: 후속 ADR로 대체됐다.
- `Deprecated`: 더 이상 유효하지 않으며 대체 결정이 없을 수 있다.

승인된 ADR의 과거 판단을 현재 관점으로 덮어쓰지 않는다. 결정을 바꾸면 새 ADR을 작성하고 기존 ADR의 상태와 대체 문서 링크만 갱신한다.

## 기록

| ADR | 상태 | 결정일 | 결정 |
|---|---|---|---|
| [0001](0001-role-based-directory-architecture.md) | Accepted | 2026-08-17 | 역할 기반 디렉터리 아키텍처 |
