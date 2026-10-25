# vuln-radar 수집 상태 표시 분리

## Summary

사용자가 지정한 개선 순서의3번을 진행했다. 통계·KEV 이후 화면 조회·수집 실행·소스 기준일을 구분하고, 알 수 없는 성공을 만들어 표시하지 않도록 보완했다. [KAN-26](https://web-tech-service.atlassian.net/browse/KAN-26)으로 추적한다.

## Changed

- backend에 process-local 실행 관측을 분리하고 status 응답으로 제공했다. 전체 성공은 DB 반영 완료 후 기록하며 소스 조회 실패·부분 성공·동시 실행409를 구분한다.
- frontend에 상태 패널·변환 모델·호환 schema를 나누었다. 조회60초와 scheduler 주기를 별도로 표시하고 구버전/재시작의 미확인·소스 조회와 원본 날짜·한영 표현을 정리했다.
- 단위·HTTP·격리 DB/브라우저 회귀와 [결정](../../architecture/adr-0016-vuln-radar-ingest-observation.md)·[검증 보고서](../../verification/integration/2026-10-22-vuln-radar-ingest-status.md)를 추가했다.

## Notes

기준은 PR #54 head32c86f8 이후 미커밋 작업 트리다. pnpm12 툴링 브랜치·보존 중인 문서·TCP·다른 세션은 변경하지 않았다. 실제 Railway/NAS/운영 DB/외부 수집은 실행하지 않았다. 테스트 실패·재검증과 실제 증거는 검증 보고서에 기록한다. 이번 변경을 이전 head의 원격 CI 성공으로 검증 완료 처리하지 않는다.

[KAN-26 검증 댓글](https://web-tech-service.atlassian.net/browse/KAN-26?focusedCommentId=10015)의3열 표와 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 로컬 결과·영속 이력 미구현·미게시 상태를 연결하고 저장 결과를 재조회했다. Jira는 검토 중이며 운영 완료로 전환하지 않았다.

## Open Questions

프로세스 재시작을 넘는 DB 영속 이력과 replica 간 분산 락은 남아 있다. 운영에 표시될 scheduler 설정과 source 관측은 backend 선반영 후 별도 확인해야 한다.

## Next

로컬 검사 결과를 검증 보고서·Jira·Confluence에 연결했다. 사용자 요청으로 backend(`fc0165a`)·화면(`1d1a23e`)·연동 회귀 검사를 독립 커밋하고, 이 문서와 증거도 별도 커밋한다. 푸시·배포는 하지 않았다. 다음 기능은4번: health·watchlist 등 일부 API가 실패해도 기존 데이터를 유지하고 해당 패널만 경고·재시도하도록 분리하는 작업이다.
