# CodeRabbit 한도 예외와 무료 리뷰 대안 점검

## Summary

사용자가 반복되는 CodeRabbit 한도 초과를 예외 처리하도록 승인했다. 실제 공식 App·head·한도 결과를 검증하는 좁은 예외를 추가하고 다른 CI·메시지·리뷰 게이트는 유지했다.

## Changed

- squash 도구는 공식 REST 체크를 모든 페이지에서 조회하고 정확한 rate-limit 결과만 `checkExceptions`로 기록한다.
- [ADR-0024](../../architecture/adr-0024-advisory-review-rate-limit.md), [운영 절차와 무료 후보 비교](../../process/squash-merge-preflight.md), [검증 보고서](../../verification/resilience/2026-10-29-coderabbit-rate-limit.md)를 연결한다.
- Brotli 게시 PR #76과 drain 조사 로컬 커밋, 기존 미커밋 preview를 보존하고 별도 브랜치에서 구현했다.

## Notes

회귀65개·strict 타입 검사·독립 읽기 전용 검토·#76 실제 check-only 검증이 통과했다. 실제 한도 예외의 감사 출력은 리뷰 성공을 뜻하지 않는다. `--admin`·직접 gh merge·범용 skip flag·원격 보호 규칙 변경은 추가하지 않았다. 새 앱 설치·권한 부여·비밀값·과금은 없다.

전체 저장소 회귀198개도 통과했다. 최초 두 포트 검사 EPERM과 허용된 환경에서 동일 검사 재실행 성공을 보고서에 구분했다. 정책 코드를 독립 커밋 `8fc3621`로 보존한 뒤, 이전부터 승인된 Brotli PR #76의 공식 squash 병합에 사용했다. 해당 main CI·Production과 공개 네 화면을 확인했다. 최신 main은 양쪽 목차를 보존해 병합했고 정책 diff만 [PR #77](https://github.com/IMHOJEONG/web-tech/pull/77)에 올렸다. 사용자가 #77도 CI·리뷰·최종 메시지 검사 후 main 반영하도록 별도 승인했다. 정책 PR의 최종 결과는 실제 확인한 뒤 연결한다.

[KAN-48](https://web-tech-service.atlassian.net/browse/KAN-48)을 제목 중복 검색 후 생성했다. [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817)에 결정 요약·실제 원격 링크와 미전파 범위를 구분해 연결한다. 저장 후 재조회한다.

## Open Questions

정책 브랜치의 원격 CI와 main 전파는 아직 별도 단계다. Sourcery를 우선 비교 후보로 제시하며 적격 OSS 지원·API/실행 비용을 구분한다. 특정 도구 설치는 별도 결정이 필요하다.

## Next

정책 변경을 독립 커밋·PR로 준비한다. 사용자가 이미 게시를 승인한 Brotli #76에는 검증한 도구로 최종 메시지 사전검사·병합·운영 확인을 이어간다. 새 정책 PR 자체의 main 병합은 별도 승인과 검증 범위를 지킨다.
