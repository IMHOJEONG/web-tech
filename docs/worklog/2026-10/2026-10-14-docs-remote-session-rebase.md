# 원격 세션 변경과 로컬 작업 보존 통합

## Summary

2026-10-14에 원격 feature/docs의 HTTP 글 게시·모바일 제목 커밋 두 개를 비교한 뒤, 미공개 로컬 도구 커밋 하나를 그 위로 리베이스했다. 원격 이력은 재작성하지 않았다. 미커밋 작업은 전체 백업과 원본 hash 대조를 거쳐 복원했다. 푸시는 수행하지 않았다.

## Changed

- 원격 `d5d9454`(HTTP 스트리밍 글 게시), `d5591d3`(모바일 본문 제목 축소)을 포함했다.
- 로컬 도구 커밋은 `30ee0c0`에서 `776f70c`로 바뀌었다. 기존 커밋의 파일 20개 중 목차를 제외한 19개는 blob이 동일하다. 목차는 양쪽 세션의 네 기록 링크를 유지했다.
- 미커밋 추적 파일 18개와 미추적 파일 142개를 stash `22b7a39e1e88443469457df84147c10a45ef2dc8`에 보존했다. 기존 stash는 변경하지 않았으며 이번 백업도 삭제하지 않았다.
- 로컬 미추적 파일 중 원격에서 추적하는 32개를 비교했다. 28개는 byte-identical이고 4개 보고서·기록은 원격 본문에 배포 후 관측을 추가한 버전이었다. 겹치는 코드의 원격 반영과 로컬 draft preview 추가분도 확인했다.
- 원격에서 새로 추적된 파일에 stash의 untracked restore가 충돌하지 않도록, 비교한 경로를 stash tree에서 `git restore --worktree`로 선택 복원했다. 인덱스에는 WIP를 추가하지 않았다.

## Notes

실행 순서: `git fetch origin feature/docs` → 비교와 SHA-256 manifest 수집 → `git stash push --include-untracked` → `git rebase d5591d3` → 목차 한 파일의 충돌 해결·스테이징 검사 → `git rebase --continue` → stash tree에서 원본 작업 복원.

- 원본 파일 160개를 복원 직후 SHA-256으로 검사했다. 누락 0개, 내용 변경 0개였다. 이후 이 기록과 목차 링크만 새로 추가했다.
- `git merge-base --is-ancestor origin/feature/docs HEAD`: 성공. 조회한 원격 HEAD가 로컬 이력에 포함됐다.
- `mise exec -- pnpm format:staged:check`, `mise exec -- pnpm validate:docs --staged`: 목차 충돌 해결 후 통과. pnpm 상태 확인의 초기 sandbox 쓰기 제한은 승인 후 재실행했다.
- `mise exec -- pnpm test:repo`: 37개 통과, 실패·skip 없음.
- `mise exec -- pnpm --filter docs test:lib`: Node 테스트 타입 검사와 단위 테스트 229개 통과, 실패·skip 없음. 복원한 WIP를 포함한 로컬 결과다.
- `git diff --check`: 통과. 브라우저 E2E·원격 CI·새 배포는 실행하지 않았다.
- Git 통합과 보존 작업이며 제품 구조·공개 계약·도구 선택이 바뀌지 않아 별도 ADR은 추가하지 않았다. [도구 개선 기록](2026-10-14-tooling-baseline-improvements.md)을 참고한다.

## Open Questions

현재 feature/docs는 조회한 origin/feature/docs보다 커밋 하나 앞서고 behind는 없다. 원격이 이후 바뀌면 푸시 직전에 다시 확인해야 한다. 미커밋 초안·배포 관측·preview 작업은 그대로 남겼으며 이번 요청을 해당 작업의 게시 승인으로 간주하지 않는다.

## Next

푸시 요청 시 정상 fast-forward push와 동일 SHA의 원격 CI를 확인한다. 원격이 더 진행됐다면 다시 비교하며 force push하지 않는다. 백업 stash는 사용자가 보존 확인 후 정리하기 전까지 유지한다.
