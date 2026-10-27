# 스켈레톤 기하 검사 런타임 격리

## Summary

main CI에서 재시도 통과한 데스크톱 골격 검사 2건을 조사했다. live React DOM 직접 교체와 늦은 hydration의 충돌을 로컬 교차 실행으로 재현하고 별도 정적 페이지 측정으로 보완한다. [KAN-40](https://web-tech-service.atlassian.net/browse/KAN-40), [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817).

## Changed

- 실제 서버 markup·완성 화면을 그대로 사용하되, 스크립트가 실행되지 않는 별도 셸에서 기하를 측정한다. 원본 화면의 완료·테마·오류 검사는 유지한다.
- 원본 노드 동일성·실행 차단·누락 실패 회귀와 선택적 CPU 지연/DOM 진단을 추가했다.
- 확장 검사에서 발견한 개발 CSS·폰트 재요청 대기는 로드된 CSSOM·실제 font 응답 재사용으로 분리했다. 상태/좌표/timeout 기준은 유지한다. 별도 태블릿 필터 Enter 실패는 미해결 관측으로 구분한다.
- [검증 보고서](../../verification/resilience/2026-10-27-skeleton-runtime-isolation.md)에 실패 증거·반복 결과·미검증 범위를 연결한다. [기존 로딩 정책](../../architecture/docs-loading-ux-policy.md)을 보강하며 앱 구조/공개 계약 변경은 없어 새 ADR은 만들지 않는다.

## Notes

기준 main e8ab3bd의 별도 작업 트리에서 수행한다. 원본 NAS/H1/대비 미커밋은 건드리지 않는다. offline 의존성 설치는 누락 tarball로 실패해 frozen online 설치로 복구했고 lockfile은 변경하지 않았다. 보고서의 실제 검사 결과를 기준으로 하며, 재시도 통과를 실패 0으로 합산하지 않는다.

## Open Questions

원격 최초 attempt의 trace가 없어 정확한 DOM 변경 호출자는 미확정이다. 실제 전환과 정적 기하 검사는 다른 검사다.

## Next

로컬 골격/격리75개·관련186개 통과(기존12개 조건부 제외)·최종 CPU 지연75개 통과와 문서/포맷/타입/lint 검사를 검증 보고서에 연결했다. Jira KAN-40 댓글10030의 실제 3열 표·본문/링크와 Confluence65817 v159의 기존 본문 보존·추가 요약을 재조회했다. 이슈는 검토 중이다. 다음 커밋·푸시·원격 CI는 사용자 요청 후 진행한다. 이번에는 PR·병합·배포·NAS 조치를 하지 않았으며 별도 태블릿 필터 Enter 간헐 실패의 원인 확정은 후속 점검으로 남긴다.
