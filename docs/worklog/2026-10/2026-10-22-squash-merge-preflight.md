# Squash 최종 메시지 사전검사 보완

## Summary

main `9a208e09eed76b32a68f7f3a310a241dabaa2a50`에서 `codex/squash-merge-preflight`를 생성했다.
PR #53 병합 메시지 실패를 재현하고, 다음 squash 요청에 최종 메시지 전체 검사와 head 고정을 추가한다.
main 이력은 재작성하지 않으며 초기 요청은 별도 PR 준비까지였다. 이후 사용자 승인으로 #55를 먼저 병합하고 #56에 최신 main을 반영하는 통합 검증을 수행했다. #56 병합은 승인 범위 밖이다.

- Jira: [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22).
- Confluence: [개발·운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira).

## Changed

- `pnpm pr:squash`: 기본 검사 전용, `--merge` 때 재검사 후 같은 메시지 스냅샷 전달.
- 루트 commitlint 규칙을 공유하는 별도 설정, Node 24 erasable TypeScript 구현·회귀 테스트.
- 저장소 테스트 glob과 CI 타입 검사 연결. 기존 main 커밋 범위 검사·실패는 보존.
- [실행 절차](../../process/squash-merge-preflight.md), AGENTS·브랜치/커밋 규칙과 목차 보완.
- pnpm12.14.0 업그레이드는 기존 [PR #55 / KAN-25](https://github.com/IMHOJEONG/web-tech/pull/55)에 맡긴다. #56은 `packageManager`·lockfile·앱 의존성 버전을 변경하지 않는다.

## Notes

로컬·원격 실행 결과와 두 PR의 역할 비교는 [검증 보고서](../../verification/resilience/2026-10-22-squash-merge-preflight.md)에 구분한다.
사용자 지적 후 #55의 실제 변경을 대조했다. #55는 이미12.14.0 설치·CI·Docker 변경이며 #56의 squash 검사와는 별도다. 초기11계열 우선 권고와 중복 업그레이드 안내를 제거하고12.14.0 선택을 #55에 연결했다. 기존11.10.0 검증 결과는 당시 증거로 보존한다.
GitHub 병합 명령은 회귀 테스트에서 격리된 대역으로 검사하며 실제 PR은 병합하지 않는다.
기존 stash·TCP·NAS·환경 파일은 변경하지 않는다. 앱 구조·공개 계약 변경이 아닌 기존 운영 규칙의 보완이므로 새 ADR은 만들지 않는다.

### PR55 병합과 통합 검증

- 최종 메시지 검사 도구로 #55를 main9fb8816에 병합하고 실제 커밋 메시지와 검사 스냅샷의 동일성을 확인했다.
- 열린 #56에 main을 no-ff 병합하며 CI·검증 목차·worklog 목차의 충돌3개를 해결했다. `typecheck:toolchain`과 `typecheck:squash`를 모두 보존하고 CI 계약 회귀도 보강했다.
- pnpm12.14.0 frozen 설치·전용 타입 검사2종·저장소108개·강제 workspace lint/typecheck/test를 통과했다. 상세는 검증 보고서의 후속 절에 둔다.
- 로컬에서 기존 Playwright 보고서 번들까지 lint하는 문제를 발견했다. 생성물 경로2개만 제외하고 실제 소스가 계속 포함되는 회귀를 추가했다. 보고서·trace는 보존했다.
- #55 main CI·Production 배포와 #56 통합 head CI를 별도로 확인한다. 원격 결과는 PR·Jira·Confluence에 최종 SHA 기준으로 연결한다.

## Open Questions

- GitHub UI 우회까지 막는 서버측 병합 메시지 정책은 별도 과제다.
- #56 통합 head의 원격 CI·리뷰 확인과 이후 별도 병합 승인이 남아 있다.

## Next

별도 PR에서 CI·리뷰를 확인한다. 사용자 병합 승인 뒤 최종 메시지를 사전검사 경로로 전달하고 main CI·배포를 다시 확인한다.
