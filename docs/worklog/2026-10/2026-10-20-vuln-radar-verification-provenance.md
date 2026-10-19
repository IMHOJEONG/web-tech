# PR #46 검증 실행 상태 식별 보완

## Summary

정리 로직 보완 커밋 3515611의 CI는 모두 성공했다. 후속 리뷰에서 baseSha만으로 실행 당시 미커밋 변경을 식별할 수 없다는 지적을 확인해 시작 시점의 workingTreeDirty를 추가한다.

## Changed

- [통합 도구](../../../scripts/verify-vuln-radar-integration.mts)는 실행 시작 시 Git HEAD와 status를 함께 읽는다. tracked·untracked 변경을 모두 판단하되 경로·파일 내용은 증거에 기록하지 않는다.
- [실행 절차](../../runbooks/vuln-radar-local-integration-verification.md)에 커밋·작업 트리·도구 해시의 구분을 설명한다.
- 생성한 artifact와 캡처 때문에 시작 상태가 오염되지 않도록 실제 검증 전에 조회한다. 이전 artifact의 메타데이터를 소급해서 만들지 않는다.

## Notes

- 첫 후속 CI의 태블릿 job은 pnpm 설치 중 ECONNRESET으로 테스트 전에 실패했다. 같은 SHA에서 해당 job과 의존 Test 게이트만 재실행해 성공했다. 코드·검사 기준은 바꾸지 않았다.
- 기존 정리 리뷰는 CodeRabbit의 수정 확인 후 해결했다. 새 식별자 보완은 타입·회귀 검사와 깨끗한 커밋에서 실제 통합 실행으로 재검증한다. 결과는 [통합 보고서](../../verification/integration/2026-10-19-vuln-radar-local-integration.md)에 추가한다.
- 기존 배포 브랜치·보관 초안·운영 환경은 변경하지 않는다.

## Open Questions

운영 배포·수집·DB migration 검증은 이 PR의 범위 밖이다.

## Next

깨끗한 작업 트리에서 생성한 새 증거를 확인하고 문서에 연결한다. PR 설명·리뷰 답변·CI도 최신 커밋 기준으로 확인한다.
