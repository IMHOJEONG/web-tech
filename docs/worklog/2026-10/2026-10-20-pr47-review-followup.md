# PR #47 리뷰 지적 보완

## Summary

[PR #47](https://github.com/IMHOJEONG/web-tech/pull/47)의 `a1fdb43`에서 CI·보안·Preview 등 검사 22개는 성공했지만 CodeRabbit 미해결 스레드 5건으로 병합이 차단되어 있었다.
지적을 실제 문서·Vercel 공식 문서·설치 CLI와 대조하고 절차와 공통 지침을 보완한다. 추적은 기존 [KAN-14](https://web-tech-service.atlassian.net/browse/KAN-14)를 재사용한다.

## Changed

- [배포 운영 절차](../../runbooks/docs-main-production-deployment.md): Preview 비인증 보호 검사와 인증 후 콘텐츠 검사 분리, CLI 53.1.1 고정, 롤백 후 정상 배포 승격과 auto-assignment 복구 확인 추가.
- [검증 artifact 목차](../../verification/artifacts/README.md)에 기존 main 전환 JSON과 보고서 연결 추가.
- 루트 `AGENTS.md`와 [문서화 규칙](../../process/codex-documentation-policy.md)의 표 대상에 `검증` 댓글을 명시해 [이슈 추적 규칙](../../process/issue-tracking.md)과 일치시킨다.
- 비공개 초안 작업 트리는 수정하지 않고 PR 브랜치의 독립 worktree에서 변경한다.

## Notes

Vercel 공식 [curl 문서](https://vercel.com/docs/cli/curl)에서 보호 자동 우회를, [Instant Rollback 문서](https://vercel.com/docs/instant-rollback#undo-a-rollback)에서 자동 도메인 할당 복구 필요성을 확인했다.
`vercel --version`은 53.1.1이며 `vercel logs --help`에서 기존 positional deployment·`--no-follow`·`--no-branch`·`--level`·`--status-code` 옵션 지원을 확인했다.
이 확인은 최신 CLI에서도 같은 문법이 동작한다는 의미가 아니므로 runbook을 검증 버전에 고정한다.

변경 문서·포맷·고신뢰 민감정보 패턴 검사와 실제 pre-commit/commit-msg 훅을 통과했다. 셸 예시 5개는 `bash -n`으로 구문을 검사했고, 세 지침의 `진행·검증·마감 댓글` 문구와 artifact 목차 연결도 검사했다.
첫 수정 `fe7d72f`를 푸시하고 근거 답글과 함께 기존 리뷰 스레드 5개를 해결했다. 새 CI는 기존 `a1fdb43` 결과와 구분해 원격에서 재확인한다.
추가 비인증 요청에서 기존 `a1fdb43` Preview는 HTTP 302와 `vercel.com/sso-api` 인증 진입점으로 응답했다. 401만 기대하도록 쓴 문구를 보완해 인증 리디렉션도 목적지를 검증하도록 했다. 리디렉션 query·쿠키는 기록하지 않았다. 이 검사는 기존 Preview 표본이며 후속 수정 SHA의 콘텐츠 검증을 대신하지 않는다.
원래 초안 작업 트리 29개 파일 해시, 브랜치/HEAD, stash 목록이 모두 그대로인 것도 확인했다.
이번 작업은 문서 보완이며 Production 설정·보호 정책·auto-assignment·배포를 변경하거나 rollback/promote를 실행하지 않는다. 새로운 구조 결정은 없어 ADR을 추가하지 않는다.

## Open Questions

수정 커밋의 새 CI·리뷰 결과와 PR #47 main 병합 이후 Production 검증은 아직 별도 완료 조건이다.

## Next

로컬 검사 후 PR 브랜치에 커밋·푸시하고, 실제 반영한 5개 스레드만 근거와 함께 정리한다.
Jira 기존 표 댓글과 Confluence 운영 안내에 변경 이유·원격 커밋·검증 상태를 갱신하고 재조회한다. main 병합은 수행하지 않는다.
