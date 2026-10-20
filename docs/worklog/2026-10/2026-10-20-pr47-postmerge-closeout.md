# PR #47 병합 후 운영 확인과 로컬 정리

## Summary

PR #47 병합 main `693d4e4`의 CI와 실제 Production·공개 사이트를 확인한 뒤 로컬 main을 갱신하고 해당 병합 작업 브랜치만 정리했다.
미커밋 초안은 현재 브랜치에 그대로 유지한다. 추적은 기존 [KAN-14](https://web-tech-service.atlassian.net/browse/KAN-14)를 사용한다.

## Changed

- [전환 검증 보고서](../../verification/deployment/2026-10-20-docs-main-production-transition.md#pr-47-병합-후-운영-검증)에 병합 후 별도 결과와 [집계](../../verification/artifacts/2026-10-20-pr47-postmerge-production.json)를 추가.
- 원래 작업 디렉터리는 checkout·stash하지 않고 로컬 main 참조만 fast-forward.
- PR head와 squash main의 파일 tree 전체 동등성을 확인한 `codex/docs-main-production-transition`만 로컬·원격에서 삭제. 일반 `branch -d`는 squash 이력상 거부되어, tree·현재 ref·worktree 비사용을 재확인한 뒤 해당 ref만 정리.
- 현재 초안 브랜치와 파일·stash·스냅샷·다른 기존 브랜치는 유지. 새 검증 기록은 별도의 최신 main 기준 로컬 브랜치에 분리.

## Notes

main CI·문서·CodeQL과 공개 HTTP·Chromium 검사는 통과했다. Runtime Logs의 제한된 표본을 전체 기간의 무장애나 신규 원격 로드의 증거로 확대하지 않는다.
PR head의 GitGuardian 최종 성공을 확인했다. CodeRabbit의 마지막 head 자동 재리뷰는 호출 제한으로 미실행이었으며, 기존 지적 6건의 직접 조치·미해결 0건과 구분해 이력을 보존한다.
Jira 기존 3열 표 댓글과 Confluence version 8에 병합·운영 결과와 정리·보존 사실을 반영하고 재조회했다. KAN-14는 완료 조건 충족을 확인해 완료로 전환했다. 앱 코드·CI·NAS·토큰·Production 설정은 변경하지 않아 신규 ADR은 없다.

초기 마감에서는 기록을 로컬에만 보관했다. 이후 사용자 승인으로 검증 보고서·집계·worklog와 목차 2개, 총 5개 파일만 별도 브랜치에서 검사해 커밋·푸시하고 main 반영용 PR로 전달한다. 원래 초안 작업 트리의 파일은 옮기거나 스테이징하지 않는다.
이번 기록 커밋의 CI·리뷰는 운영을 검증한 main `693d4e4`의 결과와 구분한다. KAN-14의 운영 마감은 유지하며 기록 PR의 병합 대기는 별도로 표시한다.

## Open Questions

실제 브라우저·기기와 장기 운영 관측은 기존 KAN-5·KAN-6의 별도 범위다. 이번 마감에서 재개하지 않는다.

## Next

기록 PR의 새 커밋에서 CI·리뷰 결과와 main 병합 상태를 확인한다. 이 PR 생성으로 재배포·운영 검증을 새로 수행했다고 주장하지 않는다.
