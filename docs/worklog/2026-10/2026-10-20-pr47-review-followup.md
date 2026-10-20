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

로컬 문서·포맷·고신뢰 민감정보 패턴·커밋 훅과 셸 예시 구문 검사는 통과했고 비공개 초안 작업 트리는 보존했다.
`fe7d72f`·`b480d59`를 푸시하고 기존 지적 5건의 [반영 근거와 해결 상태](https://github.com/IMHOJEONG/web-tech/pull/47#discussion_r4320263657)를 남겼다. Preview의 비인증 SSO 리디렉션 관측은 인증 후 콘텐츠 검증과 구분한다.
`b480d59`의 [CI 원본](https://github.com/IMHOJEONG/web-tech/actions/runs/39397772488)과 후속 커밋의 검사는 별개다. 최초 운영 전환의 실측은 기존 [검증 보고서](../../verification/deployment/2026-10-20-docs-main-production-transition.md)와 [JSON](../../verification/artifacts/2026-10-20-docs-main-production-transition.json)이 원본이며 이번 문서 검사의 증거로 대체하지 않는다.
후속 리뷰에서 완료한 작업이 `Next`에 남아 있다는 지적을 반영하고 검증 설명은 상태·원본 링크 중심으로 줄였다.
이번 작업은 문서 보완이며 Production 설정·보호 정책·auto-assignment·배포를 변경하거나 rollback/promote를 실행하지 않는다. 새로운 구조 결정은 없어 ADR을 추가하지 않는다.

## Open Questions

수정 커밋의 새 CI·리뷰 결과와 PR #47 main 병합 이후 Production 검증은 아직 별도 완료 조건이다.

## Next

후속 커밋의 원격 CI·리뷰 결과와 남은 지적 여부를 확인하고 Jira 기존 표 댓글·Confluence 운영 안내의 연결과 저장 결과를 재조회한다.
main 병합·Production 변경은 이번 작업 범위가 아니다.
