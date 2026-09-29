# 블로그 PR 병합 후 feature 브랜치 동기화

## Summary

#33이 main에 squash merge된 `677bfe1`을 활성 `feature/*` 8개 브랜치에 반영한다. 강제 푸시나 이력 재작성 대신 fast-forward 또는 merge를 사용한다.

## Changed

- `feature/issue-resolution-content-policies`, `feature/root-landing`, `feature/ui`는 main으로 fast-forward했다.
- `feature/vuln-radar`, `feature/vuln-radar-backend`, `feature/docs-backend-nas-deployment`는 각각의 미병합 고유 기능과 NAS KST 설정을 유지해 병합했다.
- `feature/repo-agent-guides`의 AGENTS 충돌은 기존 작업 원칙과 main 문서화 지침을 합쳤다. 병합 커밋의 포맷 검사가 지적한 cache fixture, locale 검사, CRP CSS 3개만 포맷했다.
- `feature/docs`의 squash 이력 충돌 39개는 이미 #33에 포함된 커밋임을 확인한 뒤 검증된 main 버전으로 해결했다. 중복으로 남은 이전 trace JSON은 제거하고 main의 보관 형식을 유지한다.
- 원래 작업 폴더의 미커밋 Obsidian 문서 4개는 동기화 커밋에서 제외한다. 기존 stash와 PR용 `codex/*`, 백업 브랜치는 동기화 대상이 아니다.

## Notes

- 기준 확인: `gh pr view 33 --json state,mergeCommit`, `git fetch origin --prune`.
- 각 브랜치의 main 포함 여부는 `git merge-base --is-ancestor origin/main <branch>`로 확인한다. 로컬·원격 SHA 일치 여부도 푸시 후 확인한다.
- `feature/vuln-radar`: `pnpm --filter vuln-radar typecheck`, `pnpm --filter vuln-radar test:lib` 통과 (4개).
- `feature/vuln-radar-backend`: `pnpm --filter vuln-radar-backend typecheck`, `pnpm --filter vuln-radar-backend test --runInBand` 통과 (26개). DB migration은 실행하지 않았다.
- `feature/docs` 코드 내용은 main과 같고, 이번 추가 변경은 동기화 작업 기록뿐이다. 공통 기능의 검증 근거는 [#33 재검증 기록](2026-09-22-shared-ui-pr-split.md)을 따른다.

## Open Questions

모든 브랜치에서 전체 E2E와 배포를 다시 실행한 것은 아니다. 미병합 vuln-radar 기능의 별도 PR 검토와 NAS 실환경 검증은 남아 있다.

## Next

8개 feature 브랜치를 원격에 일반 푸시한 후 main 조상 관계와 원격 SHA를 확인한다. 작업 폴더는 `feature/docs`로 유지하고 미커밋 문서를 복원한다.
