# Overview 부분 API 장애 대응

## Summary

수집 상태 KAN-26을 backend·화면·회귀·문서의 네 로컬 커밋으로 보존한 후, 개선4번 [KAN-27](https://web-tech-service.atlassian.net/browse/KAN-27)을 진행한다. 정상 패널은 먼저 표시하고 실패한 영역만 안내·재시도한다.

## Changed

- 공통 query 상태 모델과 패널 경계로 최초 로딩/실패와 캐시 갱신 실패를 구분한다. 전체 상태 강제 캐스트와 전역 로딩 게이트를 제거한다.
- 통계·최근 목록·워치리스트·수집 상태·KEV·health의 의존성을 분리하고, 기존 값과 마지막 응답 수신 시각을 유지한다. 핵심 패널의 중복 목록과 정적 장식 그래프는 제거했다.
- API별 최초 실패·캐시 실패·대상 재시도·보조 요청 대기·전체 실패/복구를 기존 실제 연동 검증에 추가한다. [ADR-0017](../../architecture/adr-0017-vuln-radar-panel-failure-isolation.md)과 [검증 보고서](../../verification/integration/2026-10-22-vuln-radar-partial-failures.md)에 기준·증거를 분리한다.
- PR #54의 후속 리뷰에 따라 [통계 계약](../../architecture/vuln-radar-overview-statistics.md)의 이전 ingest/status fallback 설명을 현재 패널·ADR-0017과 맞춘다. 누락은 `—`, 실제0은0으로 유지하며 다른 API 값이나 Feed 길이로 대체하지 않는다. 런타임은 변경하지 않고 status 미전달 시 누락을 유지하는 단위 회귀를 추가한다. 기존 helper의 명시적 status 전달 호환성 검사는 유지한다.

## Notes

기준은 KAN-26 최종 문서 커밋 `bffcf25` 이후 작업 트리다. 기존 PR #54의 통계·KEV 변경과 pnpm12 별도 브랜치·TCP·다른 세션은 보존한다. backend·배포 설정·운영 DB·실제 upstream 수집은 변경하지 않는다. 선행 로컬 검사 당시 푸시·배포는 하지 않았다. 초기 연동 검사의 타입 오류와 최초 실패 재시도 버튼 소실은 검증 과정에서 발견해 보완했다. 상세 결과는 보고서에 기록한다.

[KAN-27 검증 댓글](https://web-tech-service.atlassian.net/browse/KAN-27?focusedCommentId=10016)의3열 표와 [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)에 최종 결과·실패 이력·미게시 범위를 기록하고 재조회했다. Jira는 검토 중이며 배포 완료로 표시하지 않았다.

PR #54의 [문서 불일치 리뷰](https://github.com/IMHOJEONG/web-tech/pull/54#discussion_r4344759190)는 현재 패널이 status를 전달하지 않는 호출과 ADR-0017을 대조해 확인했다. 후속 정정에서 `pnpm --filter vuln-radar test:lib`32개와 `pnpm --filter vuln-radar typecheck`를 통과했다. 기존 명시적 status 인자 호환성 검사는 남기고, status가 없을 때 전체·P0·P1·KEV 누락을 미확인으로 유지하는 검사를 추가했다. 문서·테스트·이 기록만 커밋하며 런타임/API/DB/lockfile을 바꾸지 않는다. 새 커밋의 원격 CI와 리뷰 해결 결과는 PR·Jira에 연결하며 이전 head의 성공으로 대신하지 않는다.

## Open Questions

후속 승인으로 먼저7개 커밋을 PR #54에 푸시했다. `29f5c44`의 CodeQL 두 분석은 성공·결과0건이지만 main과 목차3개가 충돌해 일반 CI는 생성되지 않았다. 사용자가 추가 승인한 main 동기화는 `00ed493`을 병합하고 양쪽 verification/artifacts/worklog 목차를 보존한다. 이때 이미 main에 병합된 PR #55의 pnpm12 툴체인을 상속하며 별도 pnpm 작업 트리의 미커밋 문서는 가져오지 않는다. 일반 CI·CodeQL은 병합한 새 head로 다시 확인하고 Jira/Confluence에 구분해 기록한다. GitHub 연결 앱의 PR 본문 쓰기는403이었으며 CLI의 기존 사용자 권한으로 갱신 가능 여부를 별도 확인한다.

장기 장애의 polling/backoff, 서버 snapshot 일관성, 영속 오프라인 캐시는 이번 범위 밖이다. 사용자에게 마지막 응답 시각과 최신 보장 아님을 알리되 stale 허용 기간에 따른 추가 제한이 필요한지는 운영 후 검토한다. 기존 backend는 빈 DB Feed와 빈 watchlist에 mock fallback을 반환하므로, 빈 응답 UI는 route 주입으로 별도 검증한다. 이 기존 fallback 정책을 실제 빈 결과로 바꾸는 것은 별도 과제이며 이번에 backend를 수정하지 않는다.

## Next

로컬 회귀는 frontend31개·도구63개·실제 통합25개 그룹과 타입/lint/빌드·문서 검사까지 통과했다. 자세한 실패·재검증·화면 증거는 보고서에 연결한다. 후속 사용자 요청으로 화면(`40fe090`)·회귀(`c46ad6a`)·정책/문서/증거를 독립 커밋한다. KAN-26 네 커밋과 이 세 커밋만 PR #54 브랜치에 푸시하고 새 head의 CI·CodeQL을 확인한다. 결과는 위 Jira 검증 댓글과 Confluence에 head·실행 URL을 연결해 보존한다. 푸시가 main 병합·운영 배포·운영 검증을 의미하지는 않는다. 다음 기능 후보는 사용자 관점의 우선 확인 목록과 모바일 KEV·링크/한영 문구 정리다.
