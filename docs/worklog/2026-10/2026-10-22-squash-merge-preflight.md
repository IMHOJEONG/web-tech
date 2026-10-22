# Squash 최종 메시지 사전검사 보완

## Summary

main `9a208e09eed76b32a68f7f3a310a241dabaa2a50`에서 `codex/squash-merge-preflight`를 생성했다.
PR #53 병합 메시지 실패를 재현하고, 다음 squash 요청에 최종 메시지 전체 검사와 head 고정을 추가한다.
main 이력은 재작성하지 않으며 이번 요청은 별도 PR 준비까지다.

- Jira: [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22).
- Confluence: [개발·운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira).

## Changed

- `pnpm pr:squash`: 기본 검사 전용, `--merge` 때 재검사 후 같은 메시지 스냅샷 전달.
- 루트 commitlint 규칙을 공유하는 별도 설정, Node 24 erasable TypeScript 구현·회귀 테스트.
- 저장소 테스트 glob과 CI 타입 검사 연결. 기존 main 커밋 범위 검사·실패는 보존.
- [실행 절차](../../process/squash-merge-preflight.md), AGENTS·브랜치/커밋 규칙과 목차 보완.
- pnpm 최신 안정판은 조사만 수행했다. `packageManager`·lockfile·앱 의존성 버전은 변경하지 않았다.

## Notes

로컬 및 원격 실행 결과와 pnpm 판단 근거는 [검증 보고서](../../verification/resilience/2026-10-22-squash-merge-preflight.md)에 구분한다.
GitHub 병합 명령은 회귀 테스트에서 격리된 대역으로 검사하며 실제 PR은 병합하지 않는다.
기존 stash·TCP·NAS·환경 파일은 변경하지 않는다. 앱 구조·공개 계약 변경이 아닌 기존 운영 규칙의 보완이므로 새 ADR은 만들지 않는다.

## Open Questions

- GitHub UI 우회까지 막는 서버측 병합 메시지 정책은 별도 과제다.
- pnpm 11계열 패치 갱신과 Rust 기반 12계열 전환은 이번 PR과 분리해 검증해야 한다.

## Next

별도 PR에서 CI·리뷰를 확인한다. 사용자 병합 승인 뒤 최종 메시지를 사전검사 경로로 전달하고 main CI·배포를 다시 확인한다.
