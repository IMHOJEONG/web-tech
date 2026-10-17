# 미커밋 기록 선별과 docs 푸시 전 검증

## Summary

2026-10-09 사용자 요청으로 미커밋 변경 중 운영 보류 결정·보안 조사·브랜치 동기화 기록만 커밋 대상으로 선별했다. HTTP 스트리밍 초안과 관련 스타일·실험 증거·작성 지침은 사용자 검토 중이므로 커밋·푸시 대상에서 제외한다.

## Changed

- NAS 게시·외부 백업 보류 결정과 보안 조사 기록을 각각 독립 커밋으로 분리했다.
- 패치 전 조사 수치와 PR #36 이후 현재 구현 상태를 구분하고 TODO에 후속 운영 검증 조건을 유지했다.
- [PR #36 동기화](2026-10-09-feature-sync-after-security-pr36.md)와 [PR #37 동기화](2026-10-09-feature-sync-after-jira-pr37.md)의 기존 로컬 기록을 포함한다. 각 기록의 미푸시 상태는 당시 작업 시점이며 이번 후속 푸시와 구분한다.
- 기존 미푸시 구현인 게시 검증 CLI `c000e41`와 로컬 파일 탐색 `c574bbd`도 테스트 재검증 후 이번 사용자 승인 범위로 푸시한다.

## Notes

Node.js 24 환경에서 `mise exec -- pnpm test:repo` 27개, `mise exec -- pnpm --filter docs test:lib` 216개 및 타입 검사, `mise exec -- pnpm --filter docs test:content` 34개와 콘텐츠 18개 파일 검사가 통과했다. 각 커밋의 staged 포맷·문서 검사와 commitlint 훅을 사용한다. 새 production 빌드·원격 CI·배포 검증은 아직 실행하지 않았다.

최신 `mise exec -- pnpm audit --prod --json`은 advisory 0개, 종료 코드 0이다. 전체 `mise exec -- pnpm audit --json`은 개발 의존성에 braces high 1건과 ts-jest 경로 Handlebars critical 2건·moderate 1건을 반환했다. 종료 코드는 1이다. 샌드박스 네트워크 실패 후 승인된 실행으로 재검증했다. 패치 전 보고서의 수치를 덮어쓰지 않았으며 공통 보안 의존성을 이 문서 정리에서 변경하지 않는다. production audit 성공만으로 배포 컨테이너나 공격 도달성까지 검증한 것으로 취급하지 않는다.

HTTP 초안 원문, mdx.css의 도식 스타일, 기고 지침·runbook, HTTP 실험 artifact와 검토 worklog는 스테이징하지 않는다. 사용자 선택에 따라 기존 HTTP 초안을 계속 보강하되 상태는 draft이고 게시 승인은 별도다. 비밀값·인증 헤더·환경 파일은 기록하거나 커밋하지 않는다.

## Open Questions

- Handlebars 개발 의존성 경고는 main 기반 별도 보안 작업에서 패치 출시·상위 호환성과 두 백엔드 회귀를 확인해야 한다.
- 원격 CI·배포 상태와 NAS 운영 검증은 이번 로컬 테스트로 확정할 수 없다.

## Next

선별 커밋을 feature/docs에 푸시한 뒤 원격 tip을 확인한다. 이후 기존 HTTP 초안의 기술·독자·존댓말 검토와 원문 타입·실행 검사를 보강한다. 사용자 게시 승인 전에는 초안 및 연결 자료를 원격에 올리지 않는다.
