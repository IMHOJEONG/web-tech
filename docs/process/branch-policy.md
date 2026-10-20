# 브랜치 정책

## 상태와 범위

- 대상: 모노레포 전체의 작업 브랜치·PR·배포 브랜치 예외
- 최종 검토: 2026-10-20
- squash 병합 뒤에는 최신 `origin/main` 기준의 새 작업 브랜치를 사용한다. 이 문서 반영만으로 기존 PR·Git 이력·Vercel 설정을 변경하지 않는다.

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
- squash 병합된 브랜치에 `main`을 merge해 다음 작업을 계속하지 않는다. 기존 PR의 수정은 해당 PR이 열려 있는 동안에만 이어간다.

## 브랜치 생성 규칙

작업 시작 전 미커밋 변경과 현재 브랜치를 확인한다. 미커밋 초안이 있으면 임의로 커밋·삭제·stash하지 않고 별도 보존 또는 작업 공간 분리 방법을 확인한 뒤 진행한다. 아래 명령은 작업 트리가 정리되어 있고 로컬 `main`이 원격과 분기하지 않은 경우의 예시다.

```bash
git status --short
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/docs-search
```

`--ff-only`가 실패하면 로컬 `main`의 분기 원인을 조사한다. 강제 reset으로 맞추지 않는다. 새 브랜치는 현재 feature가 아니라 갱신한 `main`에서 생성한다.

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

## docs CI 검사와 배포 전환 상태

2026-10-20 블로그 Vercel 프로젝트 `web-tech`의 Production Branch를 `main`으로 전환하고,
동일 main SHA의 CI·Preview·Production 환경 스테이징·운영 도메인을 확인했다.
새 블로그 작업은 최신 main에서 짧은 브랜치를 생성하고 PR로 main에 반영한다.
main 병합 뒤 블로그 관련 변경이 Vercel의 영향 범위에 포함되면 Production 배포가 생성된다.
공통 패키지 변경도 영향 범위에 포함되므로 앱 디렉터리 변경 여부만으로 배포를 판단하지 않는다.

- `feature/docs`는 더 이상 블로그의 Production Branch가 아니다. 직접 push를 새 운영 배포 수단으로 사용하지 않는다.
- 기존 `feature/docs`의 로컬·원격 ref, 이전 Production 배포와 비공개 초안은 사용자 요청에 따라 그대로 보존했다. 이 문서 갱신으로 삭제·재작성하지 않는다.
- 아래 `feature/docs` push CI 예외는 아직 workflow에 남아 있다. 기존 브랜치 보존 종료와 별도 정리 PR에서 제거한다.
- 이번 전환은 Vercel의 CI 대기/Deployment Checks를 도입하지 않았다. main 병합 후에도 같은 SHA의 CI 성공과 배포 성공을 각각 확인한다.
- 절차와 복구: [블로그 main 배포 운영](../runbooks/docs-main-production-deployment.md). 실제 결과: [10-20 전환 검증](../verification/deployment/2026-10-20-docs-main-production-transition.md).

2026-09-24 도입한 기존 배포 브랜치 CI 보강은 다음과 같다. 당시 `feature/docs`가 블로그 배포 브랜치로 사용되는 동안에는
`CI`와 `Documentation` 워크플로가 `main`뿐 아니라 `feature/docs` 직접 push에서도
실행되도록 한다. 경로 필터는 두지 않아 공용 패키지·설정 변경도 검사 대상에 포함한다.
다른 feature 브랜치의 직접 push 범위는 확대하지 않으며 기존 PR 검사는 유지한다.

- `CI`: Commit Messages, Lint, Typecheck, Test와 Shared UI 검사를 실행한다.
- `Documentation`: 문서 검사기 테스트와 변경 문서 검사를 실행한다.
- PR이 열린 `feature/docs`에 push하면 push와 PR 검사가 각각 실행될 수 있다. 이번에는 기존 PR 필수 검사를 건너뛰지 않는다.
- 이 설정은 검사 실행 범위 보강이다. Vercel Git 배포는 별도로 실행되며 CI 성공을 기다리는 배포 차단 장치를 추가한 것은 아니다.
- push 후에는 같은 커밋 SHA의 Actions 결과와 Vercel 배포 상태를 각각 확인한다. 배포 성공만으로 CI 통과를 판단하지 않는다.

이는 장기 feature 브랜치를 기본 전략으로 승인하는 변경이 아니다. squash 병합된 `feature/docs`는 다음 기능 개발에 재사용하지 않는다. 운영 배포가 아직 이 브랜치를 참조한다면 배포 연결을 확인하기 전 삭제하거나 ref를 재작성하지 않는다.

docs 배포 기준 전환과 동일 커밋의 검증은 완료했지만 기존 배포 브랜치의 폐기는 별도 보존 종료 승인 뒤 진행한다. 그때 해당 push 검사 예외를 제거하며, 공통 workflow 변경도 PR로 `main`에 반영한다. 문서 변경만으로 Vercel의 Production Branch나 GitHub ruleset이 자동 변경되지는 않는다.
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
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c chore/branch-policy
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

### Squash 병합 후 필수 절차

1. PR이 실제로 병합됐는지와 `main`의 squash 결과 커밋을 확인한다. CI·리뷰가 끝나지 않은 PR을 이력 정리 목적으로 먼저 병합하지 않는다.
2. 미커밋·미푸시 변경과 배포 참조를 확인한다. 남은 작업은 사용자 승인에 따라 별도 보존하며 병합된 브랜치와 함께 버리지 않는다.
3. `git fetch origin` 후 정리된 작업 트리에서 `main`으로 이동하고 `git pull --ff-only origin main`으로 갱신한다.
4. 다음 작업은 새 이름의 짧은 브랜치로 생성하고 PR base를 `main`으로 지정한다. 병합된 브랜치의 기존 커밋을 새 브랜치에 통째로 옮기지 않는다.
5. 기존 브랜치는 보존할 변경과 배포 참조가 없음을 확인한 후 정리한다. squash는 원래 커밋을 `main`의 조상으로 만들지 않을 수 있으므로, 로컬 `git branch -d`의 거절만으로 미병합이라고 단정하거나 곧바로 `-D`를 실행하지 않는다. PR 병합 기록과 파일 차이를 먼저 확인한다.

squash는 여러 원래 커밋의 내용을 새로운 한 커밋으로 반영한다. 이전 브랜치에 `main`을 merge하면 최신 main을 포함하게는 되지만, 원래 커밋들이 main의 조상이 되는 것은 아니다. 그래서 `main..feature` 커밋 수에는 이미 파일 내용이 반영된 옛 커밋도 남을 수 있다.

검토 범위는 커밋 수만으로 판단하지 않고 다음 항목을 함께 본다.

```bash
git log --oneline origin/main..feature/docs-search
git diff --stat origin/main...feature/docs-search
git diff --name-status origin/main...feature/docs-search
```

코드 중복 여부는 이전 PR head와 squash 결과의 파일 내용도 비교한다. 커밋 목록이 길다는 이유만으로 오래된 커밋 전부를 rebase하거나 force push하지 않는다.

### 이미 재사용한 브랜치의 복구 선택

| 선택                                 | 효과                                                                                   | 확인 조건                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 현재 PR을 검토·검증한 뒤 squash 병합 | 원격 이력을 재작성하지 않고 누적 변경을 main에 반영. 이후 새 브랜치부터 이력 문제 방지 | 실제 미반영 변경 전체가 병합 의도와 일치하고 CI·리뷰를 통과해야 함                                                                 |
| 최신 main 기반 새 브랜치/PR로 대체   | 이전 브랜치의 실제 미반영 diff만 옮겨 과거 커밋 목록을 제거                            | 기존 ref·초안 보존, 대상 전체 diff/최종 파일 동일성 확인, 새 SHA에서 CI·리뷰 재실행. 새 PR 준비 후 기존 PR을 대체 관계와 함께 닫음 |
| 의존 순서대로 작은 PR로 분리         | 실제 파일·기능 리뷰 범위도 줄일 수 있음                                                | 기반 기능 → 목록 → 스켈레톤 등 선행 의존성 확인. 각 PR은 앞선 병합 후 최신 main에서 새 브랜치로 생성·검증                          |

새 브랜치로 복사해도 실제 미반영 파일 수는 자동으로 줄지 않는다. 이력 정리와 기능 범위 분리는 다른 작업이다. 누적 diff에서 방금 만든 두 커밋만 골라 나머지를 버리면 이전에 미병합된 기능이 누락될 수 있다. 원격 브랜치 재작성·기존 PR 종료·브랜치 삭제·병합·배포 설정 변경은 실행 전에 대상과 영향을 확인하고 사용자 승인을 받는다.

## GitHub 설정 체크리스트

GitHub 저장소 설정은 아래 기준을 유지한다.

### 기본 브랜치

- Default branch: `main`

### `main` ruleset

- `Require a pull request before merging`: 켠다
- `Require conversation resolution before merging`: 켠다
- `Block force pushes`: 켠다
- `Allow merge methods`: 가능하면 `squash`만 남긴다
- `Automatically delete head branches`: 켠다. 단 기존 운영 배포가 head 브랜치를 참조하면 먼저 배포 기준을 전환·확인한다.

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
- 기존 이름을 유지하려는 경우에도 새 이름을 우선한다. 이름 재사용을 위한 삭제·ref 재설정은 미반영 작업·배포 참조·백업을 확인하고 별도 승인한 예외로만 처리한다.

### 비공개 블로그 초안의 새 브랜치 이전

- 이전 feature의 전체 이력을 merge/cherry-pick하지 않고 최신 main에서 새 작업 브랜치를 만든다. 이미 main에 반영된 기능은 다시 복사하지 않는다.
- 초안은 원본 stash와 파일 해시를 보존하고, 본문·첨부자료는 동일성을 확인해 복원한다. README 목차는 현재 main의 항목을 지우지 않고 초안 항목만 합친다.
- `apps/docs/AGENTS.md`의 게시 승인 전 스테이징·커밋·푸시 금지 규칙을 유지한다. 새 브랜치를 만들었다는 사실만으로 초안 공개 승인을 받은 것으로 보지 않는다.
- 비공개 초안 브랜치는 remote upstream을 연결하지 않는다. `git push --all`이나 백업 ref 전체 push를 사용하지 않고 공개할 브랜치만 명시한다.
- 브랜치만으로 미커밋 파일이 격리되지는 않는다. 다른 브랜치로 이동하기 전 초안을 로컬 스냅샷에 보존하고, 다시 작업할 브랜치에서 복원한다. 원본 stash는 복원 검증 뒤에도 별도 폐기 승인 전 유지한다.
- 작업이 없는 main 기반 시작 브랜치는 공개 PR을 만들기 위해 빈 커밋을 추가하지 않는다. 실제 작업 시작 때 main 최신 여부를 다시 확인하고 짧은 작업 수명으로 운영한다.

적용 기록: [10-20 docs 작업·초안 브랜치 이전](../worklog/2026-10/2026-10-20-docs-main-branch-restart.md).

## feature 브랜치 동기화

`main`에 공통 변경이 들어간 뒤 아직 병합되지 않은 짧은 `feature/*` 작업 브랜치가 남아 있으면
아래 스크립트로 `origin/main` 반영 여부를 점검한다.

이미 squash 병합된 브랜치는 이 절차의 대상이 아니다. 기존 동기화 스크립트는 GitHub PR의 squash 병합 여부나 운영 배포 참조를 자동 판별하지 않으므로, 적용 전에 PR 상태와 대상 목록을 직접 확인한다. 필요하면 `--pattern=<정확한 브랜치 이름>`으로 대상 하나를 제한한다. 이 문서 수정에서 스크립트 구현을 바꾸지는 않았다.

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
- 이 동기화는 진행 중인 미병합 PR에 공통 변경을 반영하는 용도다. squash 뒤의 다음 작업 시작 방법으로 사용하지 않는다.
- 오래된 feature 브랜치를 계속 sync하기보다, 병합을 마친 후 최신 `main`에서 새 작업 브랜치를 만드는 방식을 사용한다.

## 운영 메모

- trunk-based의 핵심은 “그래프를 예쁘게 유지하는 것”보다 “긴-lived 브랜치를 만들지 않는 것”이다.
- 과거 히스토리가 다소 복잡해도, 앞으로의 작업 흐름을 `main` 중심으로 고정하면 운영 비용이 크게 줄어든다.
- 브랜치 정책 변경 시에는 ruleset과 PR 대상 브랜치를 함께 점검한다.

## 관련 문서

- `docs/process/code-review-process.md`
- `docs/process/commit-message-convention.md`
- `docs/process/codex-documentation-policy.md`
- `docs/worklog/2026-06/2026-06-17-trunk-based-branch-policy.md`
- [Squash 이후 새 브랜치 원칙 보강과 현재 PR 정리 방안](../worklog/2026-10/2026-10-19-post-squash-branch-policy.md)
