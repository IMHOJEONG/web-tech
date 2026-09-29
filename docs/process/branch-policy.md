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
- 커밋 메시지는 `type(scope): summary` 규칙을 따른다.

## 현재 docs 배포 브랜치의 CI 검사

2026-09-24 기준 `feature/docs`가 블로그 배포 브랜치로 사용되는 동안에는
`CI`와 `Documentation` 워크플로가 `main`뿐 아니라 `feature/docs` 직접 push에서도
실행되도록 한다. 경로 필터는 두지 않아 공용 패키지·설정 변경도 검사 대상에 포함한다.
다른 feature 브랜치의 직접 push 범위는 확대하지 않으며 기존 PR 검사는 유지한다.

- `CI`: Commit Messages, Lint, Typecheck, Test와 Shared UI 검사를 실행한다.
- `Documentation`: 문서 검사기 테스트와 변경 문서 검사를 실행한다.
- PR이 열린 `feature/docs`에 push하면 push와 PR 검사가 각각 실행될 수 있다. 이번에는 기존 PR 필수 검사를 건너뛰지 않는다.
- 이 설정은 검사 실행 범위 보강이다. Vercel Git 배포는 별도로 실행되며 CI 성공을 기다리는 배포 차단 장치를 추가한 것은 아니다.
- push 후에는 같은 커밋 SHA의 Actions 결과와 Vercel 배포 상태를 각각 확인한다. 배포 성공만으로 CI 통과를 판단하지 않는다.

이는 장기 feature 브랜치를 기본 전략으로 승인하는 변경이 아니다. docs 배포 기준을
`main`으로 옮길 때 해당 예외를 제거하며, 공통 workflow 변경도 PR로 `main`에 반영한다.
원격 Actions 실행과 배포 검증은 push 이후 별도로 수행한다.

관련 변경: [docs 배포 브랜치 CI 실행 범위 보강](../worklog/2026-09/2026-09-24-docs-deployment-branch-ci.md).

### 공용 UI 회귀 검사

2026-09-26 작업 트리부터 기존 Test job과 독립된 matrix job 두 개를 실행하도록 구성한다.

- `Shared UI (test:ui)`: 라이트·다크 primitive, Tooltip 설명 관계·포커스, Sidebar hydration 및 클래스 병합.
- `Shared UI (test:ui:consumer)`: docs production 빌드의 모바일 Drawer 닫기·포커스 복귀 및 Web·Mobile 주제 필터.
- 각 job은 별도 runner에서 Node 24, frozen lockfile 설치, Chromium 설치 후 실행한다. 작업당 제한은 20분이며 기존 Test job의 15분 예산을 공유하지 않는다.
- `fail-fast: false`로 한 suite가 실패해도 다른 suite 결과를 수집한다. 실패를 성공으로 처리하는 `continue-on-error`는 사용하지 않는다.
- main·feature/docs push 및 기존 PR 이벤트에 적용하며, 공용 UI 파일만의 경로 필터로 소비 코드·토큰·lockfile 변경을 누락시키지 않는다.

로컬 재현은 저장소 루트에서 아래 순서로 실행한다. 소비 테스트가 같은 `.next`를 빌드하므로 dev/build와 동시 실행하지 않고 3115 포트를 비워 둔다.

```bash
mise exec -- pnpm --filter docs exec playwright install chromium
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:ui:consumer
```

실패 시 각 job의 Actions 로그에서 실패한 테스트를 확인하고 같은 명령을 로컬에서 재현한다. 실패 trace는 각각 `apps/docs/test-results/ui`, `apps/docs/test-results/ui-consumer`에 남는다. 이번 변경은 CI artifact 업로드를 추가하지 않으므로 runner 종료 후 trace가 영구 보존되지는 않는다.

PR 병합을 강제 차단하려면 GitHub ruleset의 required checks에 위 두 실제 check 이름을 등록해야 한다. 이 저장소 파일 변경만으로 원격 ruleset이나 Vercel 배포 대기 설정을 변경하지 않는다. push 후 동일 SHA에서 두 job의 결과를 확인한다. [로컬 검증과 미검증 범위](../verification/content/2026-09-26-shared-ui-ci.md).

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

- `Commit Messages`
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

## feature 브랜치 동기화

`main`에 공통 변경이 들어간 뒤 아직 열려 있는 `feature/*` 브랜치가 남아 있으면
아래 스크립트로 `origin/main` 반영 여부를 점검한다.

```bash
pnpm branch:sync-feature
```

기본 실행은 dry-run이며, 각 feature 브랜치가 `origin/main`의 최신 커밋을 포함하는지만 확인한다.

실제로 `origin/main`을 각 feature 브랜치에 merge하려면 아래 명령을 사용한다.

```bash
pnpm branch:sync-feature:apply
```

merge 후 원격 브랜치까지 갱신하려면 아래 명령을 사용한다.

```bash
pnpm branch:sync-feature:push
```

운영 기준:

- 동기화 기준은 기본적으로 `origin/main`이다.
- 브랜치 히스토리 rewrite를 피하기 위해 기본 전략은 `merge`다.
- 충돌이 발생하면 해당 브랜치는 merge를 abort하고 실패 목록에 남긴다.
- 작업 트리가 깨끗하지 않으면 실제 적용 모드는 실행하지 않는다.
- 장기적으로는 브랜치를 자주 sync하기보다, 오래된 feature 브랜치를 닫고 `main`에서 새로 따는 방식을 우선한다.

## 운영 메모

- trunk-based의 핵심은 “그래프를 예쁘게 유지하는 것”보다 “긴-lived 브랜치를 만들지 않는 것”이다.
- 과거 히스토리가 다소 복잡해도, 앞으로의 작업 흐름을 `main` 중심으로 고정하면 운영 비용이 크게 줄어든다.
- 브랜치 정책 변경 시에는 ruleset과 PR 대상 브랜치를 함께 점검한다.

## 관련 문서

- `docs/process/code-review-process.md`
- `docs/process/commit-message-convention.md`
- `docs/process/codex-documentation-policy.md`
- `docs/worklog/2026-06/2026-06-17-trunk-based-branch-policy.md`
