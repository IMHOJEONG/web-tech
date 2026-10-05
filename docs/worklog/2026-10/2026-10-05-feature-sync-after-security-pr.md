# PR #35 병합 후 feature 브랜치 동기화

## Summary

PR #35의 실제 병합 커밋 `3134150f86cfc3d0e8ab42ec2538b2c9fde20bfa`를 기준으로 기존 feature 브랜치 8개에 보안 패치를 전달한다. 원격 main은 PR 병합으로만 갱신됐으며 main에 직접 push하지 않는다.

## Changed

- 대상: `feature/docs`, `feature/docs-backend-nas-deployment`, `feature/issue-resolution-content-policies`, `feature/repo-agent-guides`, `feature/root-landing`, `feature/ui`, `feature/vuln-radar`, `feature/vuln-radar-backend`.
- 동기화 전 로컬·원격 feature tip이 일치하고 작업 트리가 깨끗하며 다른 worktree가 대상 브랜치를 사용하지 않는지 확인했다.
- 저장소 동기화 스크립트로 7개를 반영했다. 그중 3개는 fast-forward, 4개는 merge이며 기존 커밋을 보존한다.
- `feature/docs` 충돌은 별도로 해결했다. TODO·검증 목차·artifact 목차·10월 목차는 기존 웹 푸시·검색 캐시·UI·콘텐츠 기록과 main의 보안 기록을 모두 보존한다.
- lockfile은 기존 Speed Insights·웹 푸시 의존성을 유지하며 Next.js 및 Speed Insights의 Next peer 참조를 16.3.8로 맞췄다. 통째로 main 또는 feature 버전으로 교체하지 않았다.
- force push·rebase·브랜치 삭제는 하지 않는다. 자동 삭제된 보안 PR 브랜치도 다시 원격에 만들지 않는다.

## Notes

실제 실행 순서:

```bash
git fetch origin --prune
bash ./scripts/sync-feature-branches.sh --no-fetch
mise exec -- bash ./scripts/sync-feature-branches.sh --apply --no-fetch
git switch feature/docs
git merge --no-commit --no-ff origin/main
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:article:prod category-boundary.spec.ts article-detail.spec.ts article-legacy-redirect.spec.ts article-sharing.spec.ts
```

스크립트는 docs 충돌 시 해당 merge를 abort하고 다른 7개를 계속 반영했다. 이후 수동 merge에서 충돌을 검토·해결했다. frozen install과 docs 라이브러리 검사 212개를 통과했다. production 빌드와 Chromium 모바일·데스크톱 42개 검사도 통과했다. 카테고리 20개·상세 16개·legacy 리다이렉트 4개·OG 이미지 2개다. OG 검사는 각 프로젝트에서 한국어·긴 제목·빈 제목으로 PNG signature, 1200×630 크기, 캐시 및 nosniff 헤더를 확인한다. 전체 article suite·다른 UI 전용 E2E·실제 기기는 이번 범위에 포함하지 않는다.

실제 자격증명·.env는 변경하거나 커밋하지 않는다. 테스트 원격 서버는 인증 fixture이며 NAS/Vercel에 시험 입력을 보내지 않는다. 기능 변경이 아닌 기존 보안 PR 전달이므로 새 ADR은 만들지 않는다. 배포 브랜치의 OG 이미지 회귀 확인은 RCE 재현 검사가 아니다.

[보안 패치 검증](../../verification/security/2026-10-05-next-category-hardening.md)과 [브랜치 동기화 정책](../../process/branch-policy.md#feature-브랜치-동기화)을 따른다. audit에 남은 braces high 경고는 이 동기화로 해소되는 항목이 아니다.

## Open Questions

원격 CI 및 실제 배포 완료, 필요한 NAS 이미지 pull·재시작은 push 이후 별도로 확인해야 한다. 브랜치의 main 포함 여부와 배포 완료는 구분한다.

## Next

docs merge를 커밋하고 feature 브랜치 8개를 일반 push한다. 각 원격 feature tip이 병합 main을 포함하며 로컬 tip과 같은지 검증한다. CI·배포 성공은 해당 SHA의 실행 결과로 확인한다.
