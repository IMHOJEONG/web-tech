# 커밋 메시지 규칙

## 목적

이 문서는 이 저장소에서 커밋 메시지를 어떤 형식으로 남길지 정리한다.

핵심 목표:

1. 여러 앱과 공용 패키지가 섞인 모노레포에서 변경 대상을 바로 식별한다.
2. 로컬 훅과 CI에서 같은 규칙을 자동으로 검사한다.
3. PR / worklog / git history를 나중에 다시 볼 때 검색성과 추적성을 높인다.

## 기본 형식

기본 형식은 `Conventional Commits`를 따른다.

```text
type(scope): summary
```

예:

- `docs(docs-arch): add contributor guide baseline`
- `feat(docs-app): add static footer info pages`
- `fix(vuln-radar-app): stabilize overview initial paint`
- `ci(repo-ci): add commit message validation job`

## 왜 `type(scope)`를 쓰는가

이 저장소는 `apps/docs`, `apps/vuln-radar`, `apps/vuln-radar-backend`, `packages/*`, `docs/*`가 함께 있다.

따라서 단순히:

- `docs: ...`
- `fix: ...`
- `chore: ...`

처럼 남기면 어느 영역의 변경인지 바로 드러나지 않을 수 있다.

`scope`를 함께 두면:

- 어떤 프로젝트인지
- 어떤 성격의 문서인지
- 공용 패키지인지, CI인지

를 커밋 제목만으로 빠르게 읽을 수 있다.

## 권장 `type`

- `feat`
  - 사용자 기능 추가
- `fix`
  - 버그 수정, 회귀 수정
- `refactor`
  - 동작 변화 없는 구조 정리
- `docs`
  - 문서/운영 기준 변경
- `test`
  - 테스트 추가/보강
- `ci`
  - GitHub Actions, ruleset, 자동 검증 흐름
- `build`
  - 빌드/패키지/배포 설정
- `chore`
  - 잡다하지만 운영상 필요한 정리
- `perf`
  - 성능 개선
- `style`
  - 포맷/표현 정리
- `revert`
  - 커밋 되돌리기

## 권장 `scope`

### Docs 앱

- `docs-app`
  - `apps/docs` 사용자-facing 코드
- `docs-content`
  - 문서 콘텐츠, frontmatter, authoring 규칙
- `docs-arch`
  - `docs/architecture`, `docs/runbooks`, `docs/worklog`
- `docs-search`
  - 검색/라우팅/콘텐츠 API/preview 로직
- `docs-ui`
  - 디자인 토큰, shell, layout, widget polish
- `docs-i18n`
  - 메시지, locale-aware copy, metadata i18n
- `docs-infra`
  - docs 앱의 env, fetch, asset, deploy 관련 운영

### Vuln Radar

- `vuln-radar-app`
  - `apps/vuln-radar`
- `vuln-radar-api`
  - `apps/vuln-radar-backend`

### Repo / Shared

- `repo-ci`
  - workflow, required checks, automation
- `repo-tooling`
  - pnpm, turbo, lint, format, git hooks
- `repo-docs`
  - 저장소 공통 프로세스 문서
- `design-system`
  - `packages/*` 공용 UI/토큰
- `workspace`
  - 여러 앱/패키지를 동시에 건드리는 공통 변경

## 실제 예시

- `docs(docs-app): split article detail sidebar layout`
- `docs(docs-content): require author metadata for published posts`
- `docs(docs-arch): document content api auth runbook`
- `fix(docs-search): normalize remote payload null dates`
- `ci(repo-ci): lint commit messages on pull requests`
- `chore(repo-tooling): install commitlint with simple-git-hooks`
- `feat(vuln-radar-app): add kev matrix skeleton state`

## 요약 문구 규칙

- summary는 명령형 현재형으로 짧게 쓴다.
- 마침표는 붙이지 않는다.
- 너무 추상적인 표현은 피한다.
  - 나쁨: `fix stuff`
  - 좋음: `fix docs search empty state copy`

## scope 강제 수준

현재 문서 기준으로는 `scope`를 붙이는 것을 강하게 권장한다.

다만 기존 브랜치 히스토리와의 호환성을 위해 초기 `commitlint` 설정은:

- `type`은 강제
- `scope`가 있을 경우 허용 목록 안에서만 통과
- scope 자체의 존재는 당장은 hard fail로 강제하지 않음

으로 둔다.

즉 새 커밋은 `type(scope): summary` 형식을 기본값으로 쓰되, 오래된 브랜치 커밋 때문에 CI가 한 번에 깨지지 않도록 단계적으로 닫는 방식이다.

## 자동 검사

이 저장소는 아래 두 경로에서 커밋 메시지를 검사한다.

1. 로컬 `commit-msg` hook
2. GitHub Actions `Commit Messages` job

사용 도구:

- `@commitlint/cli`
- `@commitlint/config-conventional`
- 기존 `simple-git-hooks`

## 관련 문서

- `docs/process/branch-policy.md`
- `docs/process/code-review-process.md`
