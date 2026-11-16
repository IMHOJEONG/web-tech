# 데스크톱 E2E 시간 원인 조사

## Summary

가장 오래 걸리는 responsive-desktop의 CI 시간과 테스트별 비용을 분해했다. 이후 사용자 승인에 따라 단계 계측 → 샤드 대조 → worker 대조를 로컬에서 진행했다. 기준 main은 `3b5444edabe021dc18b62baa7e7060c9353c9c3a`이며 범위·assertion·판정 기준은 유지한다. CI·Playwright 기본 설정이나 앱을 변경한 작업이 아니다.

## Changed

- [정제 검증 보고서](../../verification/performance/2026-11-15-desktop-e2e-duration.md)에 성공 CI 3회 × 3개 화면의 job/step 시간·시나리오 합계·범위 차이와 한계를 기록했다.
- 기존 설치·캐시와 worker 2개·fullyParallel 상태를 확인하고, 이미 적용된 것을 새 개선안으로 중복 제안하지 않았다.
- 테스트 수나 retry보다 공통 탐색/화면 검사의 비용이 크다는 관측과 CPU·서버·캡처의 세부 인과관계 미확정을 구분했다.
- 단계 계측 → 전체 범위를 유지하는 분산 실험 → worker/불변 준비·기동 대조 순서와 수용 조건을 정리했다.
- 선택적 단계 helper·개인 경로 전용 reporter와 반복/샤드 실행·상태 대조 도구를 추가했다. 고정 단계명과 ID hash만 집계하고 기존 Promise·화면/프로필 격리·판정은 유지했다.
- 누락·중복·새 skip·실패·retry와 원시 정보 유출·출력 충돌을 검사하는 회귀6개를 기존 `test:repo` 실행 경로에 추가했다. 집계 쓰기 실패도 성공으로 남기지 않는다.
- [반복 재현 절차](../../runbooks/docs-e2e-performance.md)를 작성했다. 로컬 순차 샤드를 분산 CI 성능으로 과장하지 않고 cold/warm·부하·순서 편향과 실패 보존 기준을 명시했다.

## Notes

[KAN-78](https://web-tech-service.atlassian.net/browse/KAN-78)에서 추적하며 상태는 검토 중이다. 기존 관련 과제를 검색했으며 같은 성능 조사 이슈가 없어 분리했다. [Confluence 정제 요약](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=17825826)을 별도 댓글로 기록하고 재조회했다. 기존 페이지 본문과 다른 작업 댓글은 변경하지 않았다.

11-16 후속 결과도 같은 Confluence 댓글v2와 Jira 기존3열 요약에 갱신하고 재조회했다. 기존 작업 트리 두 곳의 HEAD·미커밋 파일 hash·상태와 stash가 시작 스냅샷과 일치했다. 문서 검사·명시 파일 포맷·diff 검사를 통과했으며 검사 전용3078 포트는 실행 종료 후 해제됐다.

최초 CI 분석은 9개 job의 선언/통과/skip·성공 기록 수·worker·retry를 대조했다. 후속 단계의 실행 도구는 합성 테스트 코드로 저장소에 추가하고, 원시 콘솔·화면·집계 JSON은 저장소 밖 비공개 디렉터리에 유지했다. 최초 조사와 새 로컬 실행 결과는 검증 보고서에서 구분한다.

초기 기준 전체3회는 각각153통과·18skip이었다. 최초 계측 전체 실행의 readiness1건 실패를 보존하고, 같은 검사 off/on 각각20회 통과와 기하 계측 후 전체153통과를 별도 기록했다. 단독 반복 통과를 원인 해결로 선언하지 않았다. 전체 화면 목록513개와 두 샤드257+256의 ID, 실제 데스크톱 두 샤드의171개 ID·최종 상태·skip 대조가 통과했다. 자세한 시간과 한계는 보고서만 원본으로 유지한다.

worker1/2/4 탐색 실행도 모두 원래171개와153통과·18skip을 유지했다. 로컬에서4-worker가2-worker보다 느렸으므로 기본값을 늘리지 않았다. 불변 font 준비는 이미 매우 짧아 근거 없는 캐시 공유도 추가하지 않았다.

11-16 후속 검사에서 모바일·태블릿5실패 및 기존 squash 자식 프로세스 장시간 timeout을 보존했다. `ERR_NETWORK_IO_SUSPENDED`·시스템 Sleep/Wake의 시간 중첩을 확인하고, 검사 동안만 유휴 절전을 방지해 같은 기준으로 저장소257통과·교차 회귀74통과/기존6skip을 재확인했다. 영구 전원 설정은 변경하지 않았으며 최초 desktop readiness 실패의 원인 확정과도 구분했다. 도구에는 이후 원인 대조용 시작/종료 UTC·wall 시간을 추가했다.

기존 목차 후속 기록·Atlassian 진단·stash는 원래 작업 트리에 남겨 두고 별도 작업 트리에서 작업했다. frozen lockfile로 의존성을 설치했으나 패키지·lockfile은 변경하지 않았다. localhost sandbox 실패는 승인 후 동일 검사로 재실행하고 보안 정책·공통 Git 훅을 수정하지 않았다. NAS·토큰 변경은 없다. 새 CI 구조 결정을 채택하지 않아 별도 ADR은 해당 없음이다. 공개 검수 해시 갱신·커밋·푸시는 하지 않았다.

## Open Questions

- 이동 시간이 큰 것은 확인했지만 Next 서버 대기·전송·브라우저 load 중 어느 부분이 CI 차이를 설명하는가?
- 계측 wrapper가 없는 기존 readiness의 전체 병렬 실행 실패가 어떤 조건에서 재현되는가?
- 같은 범위를 분산했을 때 전체 CI 시간뿐 아니라 비용·실패율도 개선되는가?

## Next

11-16 추가 승인으로 전용 workflow·fixed-schema 합성 집계·3회 독립 job 비교와 기존 문서6개 공개 검수/푸시/Draft PR을 준비한다. 원시 자료·다른 작업·main 병합·Production 배포는 제외한다. 기존 CI·Playwright 기본 파일은 그대로이며 원격 결과는 확인 후 이어 기록한다.

독립 CI에서 동일 소스·최소3회와 queue·job 시간·비용을 확인한다. 기존 CI worker·샤드·캐시 설정과 검사 기준은 완화하지 않는다. 공개 반영은 이번 승인 범위로 한정하고 main 병합·Production 배포는 진행하지 않는다.
