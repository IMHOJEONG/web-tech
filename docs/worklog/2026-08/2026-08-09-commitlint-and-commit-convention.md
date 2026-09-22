# 2026-08-09 Commitlint And Commit Convention

## What Changed

모노레포에서 커밋 제목만 보고도 변경 대상을 더 빠르게 식별할 수 있도록
`Conventional Commits + 세분화된 scope` 기준을 도입했다.

동시에 로컬 훅과 CI에서 같은 규칙을 검사하도록 `commitlint`를 추가했다.

## Tooling Choice

이번 기준은 아래 조합으로 정리했다.

- `@commitlint/cli@21.2.1`
- `@commitlint/config-conventional@21.2.0`
- 기존 `simple-git-hooks@2.13.1` 유지

선정 이유:

- `commitlint`는 Conventional Commit 검사 도구로 가장 널리 쓰이는 축에 속하고,
- 지금 저장소에는 이미 `simple-git-hooks`가 들어 있어 훅 러너를 새로 바꿀 이유가 적었다.

즉:

- 메시지 검사 엔진은 `commitlint`
- 훅 실행기는 기존 `simple-git-hooks`

조합으로 붙이는 것이 가장 자연스러웠다.

## Implementation

### 1. Commit Convention Document

새 문서:

- `docs/process/commit-message-convention.md`

포함 내용:

- 기본 형식 `type(scope): summary`
- `docs-app`, `docs-content`, `docs-arch`, `vuln-radar-app`, `repo-ci` 등 권장 scope
- type / summary 작성 규칙
- 단계적 강제 전략

### 2. Local Hook

root `package.json`

- `commit-msg` hook에 `commitlint --edit $1` 연결
- `prepare` 스크립트로 `simple-git-hooks` 자동 설치

### 3. CI Check

`.github/workflows/ci.yml`

- `Commit Messages` job 추가
- PR에서는 `base.sha -> head.sha`
- push에서는 `before -> sha`

범위를 검사하도록 설정

### 4. Rule Strategy

이번 1차 규칙은:

- `type`는 강제
- `scope`를 썼다면 허용 목록 안에 있어야 함
- 기존 브랜치 히스토리와 충돌하지 않게 `scope` 존재 자체는 아직 hard fail로 강제하지 않음

으로 잡았다.

즉 앞으로는 `type(scope): summary`를 기본값으로 사용하되,
현재 열려 있는 브랜치의 과거 커밋 때문에 CI가 한 번에 깨지지 않도록 단계적으로 닫는 방식이다.

## Follow-Up

- 현재 열려 있는 브랜치들의 커밋 형식이 충분히 정리되면 `scope-empty`를 hard fail로 올릴지 검토
- GitHub ruleset의 required status checks에 `Commit Messages`를 실제로 추가
