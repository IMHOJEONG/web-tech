# Squash 이후 새 작업 브랜치 원칙 보강

## Summary

사용자 결정에 따라 squash 병합 후에는 최신 main에서 새 작업 브랜치를 만든다는 기준을 명시했다. 기존 trunk-based 정책을 구체화하며 현재 PR의 이력·파일 차이와 정리 선택을 구분한다.

## Changed

- [브랜치 정책](../../process/branch-policy.md)에 ff-only 갱신, 병합 브랜치 재사용 금지, 미커밋 변경·배포 참조 확인, 진행 중인 PR만 동기화한다는 기준을 추가했다.
- 현재 PR 유지·검증 후 squash, 새 main 기반 대체 PR, 의존 순서의 기능별 PR 분리를 대안으로 정리했다.
- `feature/docs`가 운영 배포 기준이면 main 배포 전환·확인 전에 삭제하거나 ref를 재작성하지 않도록 했다. GitHub/Vercel 원격 설정과 동기화 스크립트 구현은 변경하지 않았다.

## Notes

2026-10-19 Asia/Seoul에 Git/GitHub 조회로 확인했다. PR #38 head `cd48865`와 squash 결과 `93fbf6d`의 `git diff --stat` 출력은 없었다. 이전 코드 병합이 누락된 것은 아니다. PR #40은 head `ec1c7ca`, base main, OPEN·MERGEABLE·127개 파일로 확인했다. mergeable은 CI·리뷰 완료를 의미하지 않는다.

`origin/main..HEAD`에는 257개 커밋이 보이지만 PR #38 이후 first-parent 기록은 12개이며 동기화·운영 기록도 포함한다. 이번 두 UI 커밋의 실제 차이는 66개 파일이다. 그 전 main 미반영 차이는 68개 파일이며 중복 7개를 제외해 PR 전체는 127개다. 추가 17,962줄 중 검증 artifact가 12,103줄이다. 이 값은 해당 head의 관측값이며 앞으로의 PR 크기를 보장하는 수치가 아니다.

조회 명령: `git diff --stat cd48865 93fbf6d`, `git diff --shortstat origin/main...HEAD`, `git diff --shortstat 29acd24..HEAD`, `git rev-list --count origin/main..HEAD`, `git log --first-parent --oneline cd48865..HEAD`, `gh pr view 40 --repo IMHOJEONG/web-tech --json state,baseRefName,headRefName,headRefOid,mergeable,changedFiles`.

정책 작성 단계에서는 문서만 수정했다. 후속 사용자 요청에 따라 정책·목차·이 기록만 독립 커밋으로 생성해 기존 PR #40에 푸시하고, 새 head SHA의 CI와 리뷰 상태를 별도로 확인한다. PR 종료/대체/병합, 새 브랜치 생성, 강제 푸시, 원격 배포 설정 변경은 요청하지 않아 수행하지 않는다. 기존 TCP 초안과 보존 자료는 그대로 유지한다. 기존 브랜치 정책의 명확화이므로 새 ADR은 만들지 않는다.

`pnpm validate:docs`와 `git diff --check`를 통과했다. 애플리케이션 코드 변경이 없어 빌드·E2E는 이번 문서 수정 때문에 다시 실행하지 않았다.

정책 커밋 푸시 전 head `ec1c7ca`를 확인한 시점에는 Commit Messages·Lint·Typecheck·공용 UI·오프라인·CodeQL이 통과하고 Test는 진행 중이었다. 제출된 리뷰와 리뷰 스레드는 0개였다. [CodeRabbit 댓글](https://github.com/IMHOJEONG/web-tech/pull/40#issuecomment-6260590137)은 파일 수 제한과 사용 크레딧 사유로 리뷰를 생략했다고 명시한다. 체크의 success나 미해결 스레드 0을 승인·검토 완료로 해석하지 않는다. 정책 문서 푸시는 새 SHA의 CI를 다시 시작하므로 이전 SHA의 통과를 새 head의 결과로 옮겨 적지 않는다.

## Open Questions

현재 PR #40을 검증 후 그대로 병합할지, 이력을 짧게 재구성한 대체 PR을 만들지 사용자 판단이 필요하다. 대체만으로 127개 파일이 줄지는 않으며 기능별 분리는 별도 계획이 필요하다.

## Next

선택된 정리 방안은 사용자 승인 후 실행한다. 어떤 방안이든 squash 병합 뒤의 다음 작업은 최신 main 기반 새 브랜치에서 시작하고, 기존 배포 브랜치 정리는 운영 연결을 확인한 후 수행한다.
