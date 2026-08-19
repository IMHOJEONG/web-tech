# 2026-08-19 Feature Branch Sync And Commit Hook

## 배경

`main`에 README 및 공통 CI 변경이 반영된 뒤, 아직 남아 있는 `feature/*` 브랜치들이
최신 `origin/main`을 포함하지 않을 수 있다.

또한 커밋 메시지 규칙을 어긴 커밋이 뒤늦게 CI에서 발견되지 않도록,
로컬 커밋 시점에서 `commitlint`가 반드시 실행되는지 확인했다.

## 변경

- `simple-git-hooks`의 `commit-msg` 훅이 `commitlint --edit "$1"`을 실행하도록 인자를 quoting했다.
- `branch:sync-feature` 스크립트를 추가했다.
- `branch:sync-feature:apply` 스크립트를 추가했다.
- `branch:sync-feature:push` 스크립트를 추가했다.
- `docs/process/branch-policy.md`에 feature 브랜치 동기화 기준을 추가했다.

## 동기화 정책

기본 동기화 기준은 `origin/main`이다.

기본 명령은 dry-run이다.

```bash
pnpm branch:sync-feature
```

실제 merge는 별도 명령으로 분리했다.

```bash
pnpm branch:sync-feature:apply
```

원격 push까지 수행하려면 명시적으로 push 명령을 사용한다.

```bash
pnpm branch:sync-feature:push
```

## 판단

현재는 혼자 작업하는 상황이라 이미 올라간 feature 브랜치 메시지를 rewrite하는 것도 가능하지만,
앞으로는 commitlint 적용 범위를 너무 갑자기 좁히기보다 단계적으로 강화하는 편이 안전하다.

그래서 현재 정책은 다음처럼 둔다.

- 새 커밋은 로컬 `commit-msg` 훅에서 즉시 차단한다.
- PR 범위 검사는 CI에서 유지한다.
- scope 자체는 권장하되, 기존 히스토리 호환을 위해 당장 hard fail로 강제하지 않는다.
