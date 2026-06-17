# 브랜치 정책

## 목적

이 저장소는 `trunk-based development`를 기본 브랜치 운영 방식으로 사용한다.

핵심 목표는 다음과 같다.

1. 장기 통합 브랜치를 없애고 `main` 기준 흐름으로 단순화한다.
2. 오래 살아있는 브랜치 때문에 생기는 머지 꼬임과 ruleset 불일치를 줄인다.
3. 변경을 작게 나누고 자주 검증한 뒤 빠르게 `main`에 반영한다.

## 기본 규칙

- 장기 유지 브랜치는 `main` 하나만 둔다.
- 새 작업 브랜치는 항상 `main`에서 만든다.
- PR의 base branch는 항상 `main`이다.
- `develop` 같은 통합 브랜치는 다시 만들지 않는다.
- 머지 후 feature 브랜치는 바로 삭제한다.
- 오래된 feature 브랜치에서 계속 이어 작업하지 않는다.

## 브랜치 생성 규칙

작업 시작 전 순서는 아래를 기준으로 한다.

```bash
git checkout main
git pull
git checkout -b feature/<topic>
```

브랜치 이름은 아래 패턴을 권장한다.

- `feature/docs-search`
- `feature/vuln-radar-feed`
- `feature/vuln-radar-backend-watchlist`
- `fix/docs-image-host`
- `chore/ci-ruleset`

## 브랜치 네이밍 가이드

브랜치 이름은 작업 성격이 바로 드러나도록 짓는다.

- `feature/*`
  - 사용자 기능, 화면, API 기능 추가
  - 예: `feature/docs-search`, `feature/vuln-radar-watchlist`
- `fix/*`
  - 버그 수정, 회귀 수정, 타입/런타임 오류 수정
  - 예: `fix/docs-typecheck`, `fix/backend-env-loading`
- `chore/*`
  - CI, 설정, 문서 정책, 의존성, 브랜치 운영 규칙 같은 공통 변경
  - 예: `chore/branch-policy`, `chore/ci-ruleset`
- `docs/*`
  - 사용자 문서나 내부 운영 문서만 고치는 경우
  - 예: `docs/review-process`, `docs/runbook-refresh`

## PR 규칙

- 모든 변경은 PR로만 `main`에 머지한다.
- 직접 `main`에 push하지 않는다.
- 가능하면 작은 단위 PR로 나눈다.
- 리뷰 스레드는 resolve 후 머지한다.
- CI가 통과하지 않으면 머지하지 않는다.

## 공통 변경 반영 방식

이 저장소는 공통 변경을 위해 `develop` 같은 별도 통합 브랜치를 두지 않는다.

아래 성격의 변경도 모두 `main`으로 가는 짧은 브랜치로 처리한다.

- 브랜치 정책 변경
- CI / ruleset / GitHub Actions 변경
- lint / typecheck / tooling 설정 변경
- workspace 공용 패키지 설정 변경
- 프로젝트 운영 문서 변경

권장 흐름은 아래와 같다.

```bash
git checkout main
git pull
git checkout -b chore/<topic>
```

예:

- `chore/branch-policy`
- `chore/ci-check-names`
- `chore/pnpm-catalog-cleanup`

핵심 원칙은 다음과 같다.

- 공통 변경도 가능한 빨리 `main`에 반영한다.
- 공통 변경을 오래 들고 있는 별도 브랜치는 만들지 않는다.
- 다른 작업 브랜치가 이미 열려 있으면, 공통 변경 머지 후 필요할 때 `main`을 다시 반영한다.

## 머지 전략

이 저장소는 가능하면 `squash merge`를 우선한다.

이유는 다음과 같다.

- `main` 히스토리를 짧고 읽기 쉽게 유지할 수 있다.
- feature 브랜치 안의 실험/중간 커밋을 `main`에 그대로 남기지 않아도 된다.
- trunk-based에서 가장 흔한 “짧은 브랜치 + 작은 PR” 흐름과 잘 맞는다.

## GitHub 설정 체크리스트

GitHub 저장소 설정은 아래 기준을 유지한다.

### 기본 브랜치

- Default branch: `main`

### `main` ruleset

- `Require a pull request before merging`: 켠다
- `Require conversation resolution before merging`: 켠다
- `Block force pushes`: 켠다
- `Allow merge methods`: 가능하면 `squash`만 남긴다
- `Automatically delete head branches`: 켠다

### Required status checks

현재는 아래 체크 이름을 기준으로 맞춘다.

- `Lint`
- `Typecheck`
- `Test`
- `Analyze (actions)`
- `Analyze (javascript-typescript)`

보조 체크는 있을 수 있지만, ruleset에는 현재 실제로 계속 생성되는 체크 이름만 넣는다.
과거 체크 이름(`Build and Test` 등)은 남겨두지 않는다.

## 금지 규칙

아래 흐름은 사용하지 않는다.

- `develop -> main` 통합 흐름
- 기본 브랜치가 아닌 장기 통합 브랜치 운영
- 오래된 feature 브랜치에 계속 merge를 누적하는 방식
- 이미 `main`과 멀어진 feature 브랜치를 장기간 재사용하는 방식

## 오래된 브랜치 처리 규칙

- 이미 머지된 feature 브랜치는 삭제한다.
- 작업이 오래 비어 있던 브랜치는 그대로 이어가지 않는다.
- 다시 시작할 때는 `main`에서 새 브랜치를 만든다.
- 꼭 기존 이름을 유지해야 하면, 기존 브랜치를 삭제하거나 ref를 `main`으로 다시 맞춘 뒤 시작한다.

## 운영 메모

- trunk-based의 핵심은 “그래프를 예쁘게 유지하는 것”보다 “긴-lived 브랜치를 만들지 않는 것”이다.
- 과거 히스토리가 다소 복잡해도, 앞으로의 작업 흐름을 `main` 중심으로 고정하면 운영 비용이 크게 줄어든다.
- 브랜치 정책 변경 시에는 ruleset과 PR 대상 브랜치를 함께 점검한다.

## 관련 문서

- `docs/process/code-review-process.md`
- `docs/process/codex-documentation-policy.md`
- `docs/worklog/2026-06-17-trunk-based-branch-policy.md`
