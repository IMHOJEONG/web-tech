# PR #81 운영 배포 후 캐시 간헐 검사 분리

## Summary

사용자가 승인한 순서대로 PR #81의 main 병합·운영 검증을 먼저 완료하고, 간헐 테스트 조사는 별도 KAN-58과 새 main 기반 브랜치로 분리했다. 최초 간헐 원인은 아직 미확정이며 진행 중으로 유지한다.

## Changed

- 전용 squash 메시지 검사 후 main `57563f37079fb31e70da12163df456d0cdfd35dd`에 병합했다. 동일 SHA의 CI·Production 소스/alias와 Chrome 두 폭의 실제 SPA 저장·오프라인 읽기·목차를 확인했다. [배포 보고서](../../verification/deployment/2026-11-01-pr81-offline-toc-production.md)에 범위를 둔다.
- 새 `codex/docs-e2e-cache-observation-20261101`에서 원래 trace의 실제 HTML과 캐시·요청 로그를 대조했다. 성공 본문이 있으면 로그 누락보다 그 응답 상태를 먼저 지적하고 HTML 대신 boolean만 출력하도록 검사 순서를 보완했다. [조사 보고서](../../verification/resilience/2026-11-01-publication-cache-request-cause.md)에 실패·반복·강제 대조를 연결한다.
- 합성 인증은 기존 공용 fixture helper를 재사용한다. 공개 검사 실패를 예외나 `--no-verify`로 넘기지 않는다.
- 진단 보완 로컬 커밋 `9446a7e64f12e10553fe8447e8e4c546c44765ca`는 코드 파일 1개만 포함한다. 전체 178개 후 최종 helper 통일 상태의 집중 8개·타입·lint·포맷을 다시 확인했다. 문서 검수 전에는 원격 푸시하지 않는다.

## Notes

새 ADR은 추가하지 않았다. 이번 후속은 운영 캐시 계약을 변경하는 설계가 아니라 검증·오류 진단 보완이다. 기존 원본 초안의 파일 해시·stash·NAS 브랜치를 유지하며 원시 로그/프로필은 공개하지 않는다. 새 문서의 공개 검수와 코드·문서 푸시는 선행 PR #81의 병합 승인과 별도로 취급한다.

[PR #82](https://github.com/IMHOJEONG/web-tech/pull/82)의 head `9c566d06bf696b4849f6e6fd0fc5db8ca5b7ac8c`는 원격 CI·문서·보안 검사와 두 Vercel Preview를 통과했다. CodeRabbit의 Minor 2건을 대조해 두 보고서의 `결과와 증거`에 artifact 링크가 해당 없는 이유와 공개 증거의 한계를 로컬에서 명시했다. 기존 집계·기대 실패·최초 원인 미확정 결론은 유지하며 별도 artifact를 만들어 원시 증거처럼 제시하지 않는다. 이 문서 보완은 새 공개 승인 전에는 커밋·푸시하거나 리뷰 해결로 표시하지 않는다.

보완 문서 3개의 작업 트리 bytes를 기존 문서 검사기의 `validate`에 전달한 형식·상대 링크 검사, Prettier와 `git diff --check`가 통과했다. 문서 검사기 회귀는 `node --test scripts/documentation-checks.test.mjs`로 17개 통과했다. 문서만 변경했으므로 앱 빌드·브라우저 E2E는 재실행하지 않았으며, 이전 head의 CI 성공을 새 문서 수정의 원격 검증으로 간주하지 않는다. stage·공개 검사는 최종 공개 승인 후 별도로 실행한다.

## Open Questions

원래 간헐 실행이 최초로 stale 상태에 들어간 원인은 확정하지 못했다. 503이 있었어도 실제 HTML은 정상 본문이었다는 관측과 합성 stale 대조를 실제 최초 원인으로 확대하지 않는다.

## Next

최종 공개본·해시를 검수하고 해당 승인 범위만 후속 브랜치에 커밋·푸시한다. KAN-58은 재현 가능한 최초 트리거와 수정 전후 대조가 확보되기 전까지 완료로 바꾸지 않는다. 후속 main 반영·추가 배포는 별도 승인 대상이다.
