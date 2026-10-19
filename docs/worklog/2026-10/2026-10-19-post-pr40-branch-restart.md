# PR #40 병합 후 새 브랜치 출발과 초안 보존

## Summary

PR #40의 squash 결과 `8da00b3`으로 로컬 main을 fast-forward하고, 새 작업 브랜치 `codex/post-pr40-branch-cleanup`을 만들었다. 과거 feature 이력을 다시 merge하지 않았다. 미커밋 초안은 원격에 게시하지 않고 로컬에 보존했다.

## Changed

- 추적 파일 4개와 미추적 파일 19개를 stash `764b9306e38621c868333d1ae12a12b8f0884965`에 보존했다. 원본 파일별 SHA-256과 stash의 추적·미추적 tree 내용을 대조해 23개 모두 일치함을 확인했다.
- 로컬 전용 `refs/codex-backups/2026-10-19-after-pr40/stash`로 stash 객체를 추가 보존했다. 기존 feature 브랜치와 이전 main 위치도 같은 백업 ref namespace에 보존했다. 일반 Git 브랜치 push 대상이 아니며 이 namespace나 stash를 원격으로 push하지 않는다.
- `git switch main` → `git pull --ff-only origin main` → `git switch -c codex/post-pr40-branch-cleanup` 순서로 진행했다. 새 브랜치 생성 직후 HEAD와 `origin/main`은 모두 `8da00b3`이며 `origin/main..HEAD` 커밋은 0개다.
- 고유 변경이 없고 main의 조상이며 열린 PR·확인된 Production Branch가 아닌 `feature/ui`, `feature/root-landing`, `feature/issue-resolution-content-policies`를 로컬 `git branch -d`와 원격 삭제로 정리했다. 강제 삭제·reset·force push는 사용하지 않았다.
- 미반영 변경이 있는 아래 브랜치는 기존 위치 그대로 보존했다. 작업 재개 시 해당 변경만 최신 main 기반의 새 브랜치로 이전한다. 열린 PR이 없는 오래된 브랜치에 main을 일괄 merge하거나 빈 대체 브랜치를 미리 만들지는 않았다.

| 보존 브랜치                           | 기존 HEAD | 미반영 후보 파일 | 내용                              |
| ------------------------------------- | --------- | ---------------- | --------------------------------- |
| `feature/docs-backend-nas-deployment` | `9980299` | 3                | NAS env 예시·Compose·배포 runbook |
| `feature/repo-agent-guides`           | `d8590b7` | 2                | 공통·docs AGENTS 지침             |
| `feature/vuln-radar`                  | `b59f6d2` | 20               | 피드 필터·출처·신뢰성 표시        |
| `feature/vuln-radar-backend`          | `301d4c5` | 24               | 수집 timeout·재시도·신뢰성        |

미반영 후보는 각 브랜치와 main의 merge-base부터 해당 브랜치까지의 파일 diff다. 커밋 수를 그대로 새로운 변경 수로 간주하지 않는다. `feature/docs`는 원래 커밋이 main 조상으로 보이지 않아도 PR #40의 병합 기록과 두 tip의 tree 차이 0으로 이미 반영됐음을 확인했다.

## Notes

- GitHub에서 PR #40이 병합됐고 열린 PR이 없음을 확인했다. 관련 worktree에 다른 브랜치가 사용 중인지도 점검했으며 다른 worktree는 수정하지 않았다.
- Vercel 공식 CLI의 읽기 전용 프로젝트 API로 Production Branch를 확인했다. 블로그 `web-tech`는 `feature/docs`의 `23fcab4`, `vuln-radar`는 `feature/vuln-radar`의 `b59f6d2`를 참조한다. 두 브랜치를 삭제·재작성하지 않았다. 토큰·env 값은 조회 결과에 출력하거나 기록하지 않았다.
- main 병합 커밋의 Vercel 기록은 두 프로젝트 모두 Preview였다. 이번 작업에서 Production Branch 설정·도메인·운영 배포는 변경하지 않았다. 특히 vuln-radar는 main에 없는 기능이 있어 지금 main으로 운영을 전환하면 기능이 빠질 수 있다.
- 초안은 stash를 drop/pop하지 않고 남겼다. 현재 새 브랜치에는 이 작업 기록과 목차만 새로 변경하며 TCP 본문·이미지·검증 자료를 복원하거나 커밋하지 않는다.
- 문서 포맷·링크·상태 검사를 수행한다. 앱 코드 변경이 없어 앱 빌드·E2E를 이번 브랜치 관리의 검증으로 재실행하지 않는다. 새 브랜치의 문서 커밋·push·PR 생성은 아직 하지 않았다.

초안 작업을 재개하려면 현재 변경을 먼저 별도 보존하거나 커밋하고, 최신 main에서 초안 전용 새 브랜치를 만든 뒤 아래 로컬 ref를 apply한다. `apply`는 백업 ref를 삭제하지 않으며 충돌이 있으면 덮어쓰거나 강제 reset하지 않고 파일별로 확인한다.

```sh
git stash show --stat --include-untracked refs/codex-backups/2026-10-19-after-pr40/stash
git stash apply refs/codex-backups/2026-10-19-after-pr40/stash
```

이는 로컬 Git 작업 보존이며 저장소 손실까지 대비하는 외부 재해 복구 백업은 아니다.

## Open Questions

- NAS 설정·지침·vuln-radar 두 앱의 미반영 변경을 어떤 순서로 작은 PR로 통합할지 정해야 한다.
- 블로그를 main Production Branch로 전환한 뒤 동일 SHA의 운영 배포와 주요 라우트를 확인해야 `feature/docs` 및 CI의 배포 브랜치 예외를 폐기할 수 있다. vuln-radar의 전환은 미반영 기능 통합 이후 별도로 판단한다.

## Next

선택한 미반영 작업만 새 main 기반 브랜치로 이전해 검증·PR을 진행한다. 정책과 배포 예외는 [브랜치 정책](../../process/branch-policy.md)을 따른다. 기존 브랜치 전체 동기화나 운영 설정 변경은 이번 작업 범위에 포함하지 않는다.
