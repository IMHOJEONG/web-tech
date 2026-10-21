# PR #51 CRP navigation 비교 결함 조사와 회귀 보완

## Summary

PR 템플릿·추적 규칙의 개인 정보 미표기는 `344fd09`로 별도 커밋했다. 이어서 CRP의 서로 다른 navigation `startTime` 비교가 정상 타이머를 오판하는 경우를 재현하고, 동일 문서의 예약·발견·요청 관계를 검사하도록 보완했다.

## Changed

- CRP 브라우저 테스트와 실험 asset 두 mark, 실험 README를 수정했다. 보안 의존성이나 블로그 공개 글은 바꾸지 않았다.
- 기준 응답 지연 0/500ms와 지연 제거 음성 대조군을 추가했다. 원래 CSS·스크립트 검사도 유지했다.
- [검증 보고서](../../verification/performance/2026-10-21-crp-navigation-timing.md)와 [실제 측정 증거](../../verification/artifacts/2026-10-21-crp-navigation-timing.json)를 연결했다. 새 구조 결정이 아니라 검사 계약 수정이므로 새 ADR은 만들지 않았다.

## Notes

최종 5개 × 20회 브라우저 검사가 100개 모두 통과했다. 정상 대기는 240.70~242.20ms였고, 기준 HTML 응답을 늦춘 20개는 기존 판정이면 모두 실패했지만 새 판정은 통과했다. 지연 제거 변형 20개는 같은 정상 판정 함수가 거부했다. CRP 서버 6개·타입·파일 lint와 저장소 63개도 통과했다.

추적은 [KAN-21](https://web-tech-service.atlassian.net/browse/KAN-21)과 기존 [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)를 사용한다. 기존 보안 과제 KAN-20의 미해결 braces는 완료로 바꾸지 않는다. 필요한 원본 URL과 Jira 담당자 설정은 유지하며 PR에는 개인 정보를 옮기지 않는다.

## Open Questions

원격 CI에 개별 navigation 타이밍·trace artifact가 없어 당시 특정 초기 처리 비용의 원인은 확정할 수 없다. 수정 후 원격 CI·운영 배포는 아직 검증하지 않았다. 현재 CI는 첨부 리포트를 원격 artifact로 보관하지 않는다.

## Next

사용자 승인에 따라 CRP 후속 변경을 규칙 커밋과 분리해 커밋하고 두 커밋을 함께 푸시한다. 같은 PR head의 CRP·최종 Test와 전체 CI를 재확인하며, 실행 ID·결과와 원격 문서 permalink를 PR·Jira·Confluence에 연결한다. 기존 원격 실패와 당시 로컬 검증 기록을 성공으로 덮어쓰지 않는다. main 병합·운영 배포는 이번 승인 범위가 아니다.
