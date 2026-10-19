# PR #40 병합 후 새 브랜치 출발과 초안 보존

## Summary

PR #40의 squash 결과 `8da00b3`으로 로컬 main을 fast-forward하고, 새 작업 브랜치 `codex/post-pr40-branch-cleanup`을 만들었다. 과거 feature 이력을 다시 merge하지 않았다. 미커밋 초안은 원격에 게시하지 않고 로컬에 보존했다. 후속 요청에 따라 작업 기록을 `6e3b54b`로 커밋하고, 미반영 변경이 있는 4개 브랜치도 같은 main 기준의 독립 브랜치로 이전했다.

## Changed

- 추적 파일 4개와 미추적 파일 19개를 stash `764b9306e38621c868333d1ae12a12b8f0884965`에 보존했다. 원본 파일별 SHA-256과 stash의 추적·미추적 tree 내용을 대조해 23개 모두 일치함을 확인했다.
- 로컬 전용 `refs/codex-backups/2026-10-19-after-pr40/stash`로 stash 객체를 추가 보존했다. 기존 feature 브랜치와 이전 main 위치도 같은 백업 ref namespace에 보존했다. 일반 Git 브랜치 push 대상이 아니며 이 namespace나 stash를 원격으로 push하지 않는다.
- `git switch main` → `git pull --ff-only origin main` → `git switch -c codex/post-pr40-branch-cleanup` 순서로 진행했다. 새 브랜치 생성 직후 HEAD와 `origin/main`은 모두 `8da00b3`이며 `origin/main..HEAD` 커밋은 0개다.
- 고유 변경이 없고 main의 조상이며 열린 PR·확인된 Production Branch가 아닌 `feature/ui`, `feature/root-landing`, `feature/issue-resolution-content-policies`를 로컬 `git branch -d`와 원격 삭제로 정리했다. 강제 삭제·reset·force push는 사용하지 않았다.
- 미반영 변경이 있는 아래 원본 브랜치는 기존 위치 그대로 보존했다. 최초 정리 후 후속 요청을 받아 실제 미반영 변경만 새 브랜치로 이전했다. 오래된 브랜치에 main을 일괄 merge하거나 원본 ref를 재작성하지 않았다.

| 보존 브랜치                           | 기존 HEAD | 미반영 후보 파일 | 내용                              |
| ------------------------------------- | --------- | ---------------- | --------------------------------- |
| `feature/docs-backend-nas-deployment` | `9980299` | 3                | NAS env 예시·Compose·배포 runbook |
| `feature/repo-agent-guides`           | `d8590b7` | 2                | 공통·docs AGENTS 지침             |
| `feature/vuln-radar`                  | `b59f6d2` | 20               | 피드 필터·출처·신뢰성 표시        |
| `feature/vuln-radar-backend`          | `301d4c5` | 24               | 수집 timeout·재시도·신뢰성        |

미반영 후보는 각 브랜치와 main의 merge-base부터 해당 브랜치까지의 파일 diff다. 커밋 수를 그대로 새로운 변경 수로 간주하지 않는다. `feature/docs`는 원래 커밋이 main 조상으로 보이지 않아도 PR #40의 병합 기록과 두 tip의 tree 차이 0으로 이미 반영됐음을 확인했다.

### 후속 이전 결과

| 원본 브랜치                           | 새 브랜치                             | 새 커밋   | main 대비 변경 파일 |
| ------------------------------------- | ------------------------------------- | --------- | ------------------- |
| `feature/docs-backend-nas-deployment` | `codex/docs-backend-nas-config`       | `097de68` | 3                   |
| `feature/repo-agent-guides`           | `codex/repo-agent-guides`             | `5ec3e8e` | 2                   |
| `feature/vuln-radar`                  | `codex/vuln-radar-feed`               | `8927b4f` | 20                  |
| `feature/vuln-radar-backend`          | `codex/vuln-radar-ingest-reliability` | `8081121` | 25                  |

네 브랜치는 모두 `8da00b34a1a2444024e8677f589d90e00faa02cb`를 유일한 부모로 하는 커밋 1개만 추가했다. `git switch --no-track -c <새 브랜치> origin/main` 후 `git merge --squash --no-commit <원본>`으로 이전했다. NAS 브랜치는 최초 자동 추적을 즉시 해제했다. 후속 push에서는 네 브랜치 모두 각자 이름의 origin 브랜치를 추적하도록 설정했으며, `origin/main`을 push 대상으로 추적하지 않는다.

백엔드는 앱의 23개 변경 파일을 바이트 단위로 보존했다. 과거 작업 기록 하나만 백엔드 새 브랜치의 `docs/worklog/2026-09/2026-09-01-nvd-ingest-request-stability.md`로 옮겨 필수 섹션과 상대 링크를 추가하고 9월 목차에 연결했다. 이 때문에 원본 후보 24개에서 최종 변경은 25개 파일이 됐다. 당시 NVD 측정값을 새 실행 결과로 표현하지 않았으며 앱 로직은 변경하지 않았다.

### 원격 게시와 PR

추가 사용자 요청으로 2026-10-19에 작업 기록 브랜치와 새 브랜치 4개를 origin에 게시했다. 5개 ref를 명시한 `git -c push.followTags=false push --atomic --set-upstream origin ...`의 dry-run으로 대상을 확인한 뒤 실제 push했다. main·기존 feature·백업 ref·태그는 push 대상에서 제외했다.

| 목적                  | main 대상 PR                                         |
| --------------------- | ---------------------------------------------------- |
| 작업 기록             | [#41](https://github.com/IMHOJEONG/web-tech/pull/41) |
| NAS 시간대 설정       | [#42](https://github.com/IMHOJEONG/web-tech/pull/42) |
| 공통 작업 지침        | [#43](https://github.com/IMHOJEONG/web-tech/pull/43) |
| 피드 필터·신뢰성 표시 | [#44](https://github.com/IMHOJEONG/web-tech/pull/44) |
| 백엔드 수집 안정성    | [#45](https://github.com/IMHOJEONG/web-tech/pull/45) |

5개 PR의 base가 main이고 각각 의도한 head와 변경 파일 수를 갖는지 GitHub에서 확인했다. PR 본문에 로컬 검증·미검증 범위를 구분했다. PR을 병합하거나 자동 병합을 설정하지 않았고 기존 배포 브랜치·Production Branch 설정도 변경하지 않았다. push와 PR 생성으로 자동 시작되는 CI·Preview는 운영 배포 검증과 구분한다.

## Notes

- GitHub에서 PR #40이 병합됐고 열린 PR이 없음을 확인했다. 관련 worktree에 다른 브랜치가 사용 중인지도 점검했으며 다른 worktree는 수정하지 않았다.
- Vercel 공식 CLI의 읽기 전용 프로젝트 API로 Production Branch를 확인했다. 블로그 `web-tech`는 `feature/docs`의 `23fcab4`, `vuln-radar`는 `feature/vuln-radar`의 `b59f6d2`를 참조한다. 두 브랜치를 삭제·재작성하지 않았다. 토큰·env 값은 조회 결과에 출력하거나 기록하지 않았다.
- main 병합 커밋의 Vercel 기록은 두 프로젝트 모두 Preview였다. 이번 작업에서 Production Branch 설정·도메인·운영 배포는 변경하지 않았다. 특히 vuln-radar는 main에 없는 기능이 있어 지금 main으로 운영을 전환하면 기능이 빠질 수 있다.
- 초안은 stash를 drop/pop하지 않고 남겼다. 기록 브랜치에는 이 작업 기록과 목차만 커밋하며 TCP 본문·이미지·검증 자료를 복원하거나 커밋하지 않았다. 이전 완료 후에도 원본 SHA-256과 stash 파일 23개가 모두 일치했다.
- 각 커밋에서 정상 훅의 staged 포맷·문서 검사·commitlint를 통과했다. NAS 커밋 본문이 최초 100자 줄 길이 검사에서 거절되어 본문만 줄바꿈한 뒤 재검사했다. 검사 우회는 하지 않았다.
- staged 파일의 고신뢰도 비밀정보 패턴 검사에서 탐지 사항이 없었다. 실제 env·인증 토큰·로컬 백업 ref를 커밋하지 않았다. 이는 외부 비밀정보 탐지 서비스의 전수 감사와 같지는 않다.
- 최초 이전 요청은 로컬 커밋까지 수행했고, 후속 요청에서 위 5개 브랜치 push·PR 생성을 완료했다. 운영 배포·병합은 하지 않았다. 최종 작업 위치는 `codex/post-pr40-branch-cleanup`이다.
- push 응답에 GitHub 기본 브랜치의 기존 High 취약점 1건 안내가 있었다. [Dependabot #336](https://github.com/IMHOJEONG/web-tech/security/dependabot/336)의 상세 조사·수정은 이번 브랜치 게시 범위에 섞지 않았다.

### 검증 결과와 재현 명령

아래 명령은 해당 새 브랜치에서 실행했다. 앱 검사는 Node `24.12.0`으로 수행했으며, 명령의 `node`는 프로젝트 Node 24 환경을 전제로 한다.

- NAS: `docker compose --env-file apps/docs-backend/.env.nas.example -f apps/docs-backend/docker-compose.yml config --quiet` 성공. 구문 검사만 수행했으며 컨테이너를 실행·재생성하지 않았다.
- 공통 지침: 변경은 `AGENTS.md`, `apps/docs/AGENTS.md` 두 파일이며 staged 포맷·문서 검사가 성공했다.
- 프론트: `apps/vuln-radar`에서 `node --experimental-strip-types --test ./src/pages/feed/model/*.test.ts` 4개 통과, `node node_modules/typescript/bin/tsc --noEmit` 성공. 변경한 TS/TSX 파일의 ESLint도 경고 없이 통과했다. ESLint는 앱 로컬 경로에 없어 루트의 `../../node_modules/eslint/bin/eslint.js`를 사용했다.
- 프론트 빌드: 같은 앱에서 `node node_modules/vite/bin/vite.js build --outDir /tmp/pr40-vuln-feed-build` 성공. 결과를 임시 경로에 생성했으며 외부 출력 경로를 자동 비우지 않는다는 Vite 안내 외에 빌드 실패는 없었다.
- 백엔드: `apps/vuln-radar-backend`에서 `node node_modules/jest/bin/jest.js --runInBand` 10개 suite·26개 테스트 통과, `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` 성공. 변경 영역의 ESLint도 경고 없이 통과했다. 테스트의 timeout·403·partial 로그는 mock 시나리오이며 운영 수집 결과가 아니다.
- 기존 로컬 node_modules의 `enableGlobalVirtualStore` 설정 불일치 경고가 있어 커밋 훅 실행 시 `pnpm_config_verify_deps_before_run=warn`을 사용했다. 자동 재설치만 막았으며 정상 훅은 그대로 실행했다. 의존성·lockfile을 수정하지 않았다.

전체 tree 동일성은 각 원본에 대해 `git merge-tree --write-tree origin/main <원본>`의 결과를 실제 이전 tree와 대조했다. 처음 세 브랜치는 다음 tree ID가 그대로 일치했다.

| 이전 대상 | 검증 tree                                  |
| --------- | ------------------------------------------ |
| NAS       | `274bd965ad0b4da59c715f47fd39bb000562340b` |
| 공통 지침 | `9c6200a2ee202d24bb89da2b50aab6e981a468ed` |
| 피드      | `389d3d91047686d70b4fe2d6a3deeb916ca16c5b` |

백엔드는 정규화 전 tree `15b0b3bb24d6cf9da08a2d53833a7ee7d0419251`과 앱 변경 23개 파일의 blob ID가 모두 일치했다. 이후 tree 차이는 과거 작업 기록의 이동·형식 보완과 9월 목차뿐이다. 예를 들어 `git diff --name-status 15b0b3bb24d6cf9da08a2d53833a7ee7d0419251 codex/vuln-radar-ingest-reliability`로 이 예외를 확인할 수 있다.

`git show -s --format='%H %P' <새 브랜치>`와 `git rev-list --count origin/main..<새 브랜치>`로 각 브랜치의 유일한 부모와 추가 커밋 수 1을 확인했다. `git ls-remote --heads origin main feature/docs feature/docs-backend-nas-deployment feature/repo-agent-guides feature/vuln-radar feature/vuln-radar-backend`로 원격 main 및 기존 5개 브랜치의 HEAD가 위 원본 값 그대로임도 확인했다.

초안 작업을 재개하려면 현재 변경을 먼저 별도 보존하거나 커밋하고, 최신 main에서 초안 전용 새 브랜치를 만든 뒤 아래 로컬 ref를 apply한다. `apply`는 백업 ref를 삭제하지 않으며 충돌이 있으면 덮어쓰거나 강제 reset하지 않고 파일별로 확인한다.

```sh
git stash show --stat --include-untracked refs/codex-backups/2026-10-19-after-pr40/stash
git stash apply refs/codex-backups/2026-10-19-after-pr40/stash
```

이는 로컬 Git 작업 보존이며 저장소 손실까지 대비하는 외부 재해 복구 백업은 아니다.

## Open Questions

- 새 PR의 원격 CI·리뷰는 시작 이후 결과 확인이 필요하며 완료로 간주하지 않는다. 프론트·백엔드 통합 E2E도 아직 수행하지 않았다. 각각 독립 main 기반이므로 API 계약 변경을 함께 사용할 때의 운영 연동은 별도 확인이 필요하다.
- 블로그를 main Production Branch로 전환한 뒤 동일 SHA의 운영 배포와 주요 라우트를 확인해야 `feature/docs` 및 CI의 배포 브랜치 예외를 폐기할 수 있다. vuln-radar의 전환은 미반영 기능 통합 이후 별도로 판단한다.

## Next

생성한 PR별로 동일 SHA의 CI·리뷰를 확인한 뒤 main 반영 여부를 결정한다. 프론트·백엔드 통합 검증과 운영 전환은 별도로 진행한다. 정책과 배포 예외는 [브랜치 정책](../../process/branch-policy.md)을 따른다. 기존 원본·배포 브랜치 삭제, 운영 설정 변경과 초안 복원은 이번 작업 범위에 포함하지 않는다.
