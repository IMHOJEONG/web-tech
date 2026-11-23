# 503 대조 검사의 종료 계측 준비 상태 보완

## Summary

main CI의 `responseFinished=false` 첫 실패를 이전 정상 본문·background 503 사건과 분리했다. 같은 요청의 종료 기록을 확인하지 않고 JSON을 즉시 읽는 결함을 통제 재현하고, 기존 503 판정 기준을 유지하는 로컬 수정과 회귀를 추가했다. 실제 과거 CI의 최초 원인은 미확정이다.

## Changed

- 상세 E2E에 종료 증거 reader와 실제 HTTP·합성 상태 회귀 8개를 추가했다. 503의 기존 assertion은 공용 테스트 helper로 옮겨 각 음성 조건을 실제 검사와 공유한다.
- [검증 보고서](../../verification/resilience/2026-11-22-upstream-503-trace-readiness.md)에 조건·명령·수정 전 실패·수정 후 통과·한계를 기록했다.
- [KAN-58 후속 기록](https://web-tech-service.atlassian.net/browse/KAN-58?focusedCommentId=10129)과 [Confluence 개념 문서](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=20119968)를 연결했다.

## Notes

- 기준 main `4b3e221b818525ba5eb73123e03b27e4d6d0596d`, `codex/docs-503-trace-readiness-20261122` 별도 작업 트리에서 진행했다.
- 단독 회귀 24회, 실제 Next 503 수정 전·후 각 10회, 최종 production 214개(기존 opt-in skip 2개)·타입·변경 소스 lint 통과. 이전 즉시 읽기 대조의 실제 HTTP 3회 실패는 기대한 음성 대조이며 정상 검사의 실패로 숨기지 않는다.
- 다른 창의 3112 서버는 직접 종료하지 않고 반환 후 실제 Next 검사를 수행했다. 기존 test timeout 30초·expect 10초·worker 1·retry 0과 모든 503 acceptance 조건을 유지했다.
- 재사용 지식은 Confluence에서 클라이언트 완료·서버 이벤트·기록 완료의 구분과 종료 증거 기반 판정으로 승격했다. 원본 공개 코드와 Jira를 연결하고 새 helper는 미커밋으로 명시했다.
- 최초 조사 이후 사용자가 이번 소스3개·정제 문서/목차4개와 공개 검수 목록만 검수·작업별 커밋·푸시·PR 준비하도록 승인했다. 코드/회귀는 `2fccc979300a7414bd2a90d436055a61516da1bd`, 문서와 승인된 최종 bytes의 해시는 별도 커밋으로 분리한다. 원시 자료·기존 미커밋·stash·비공개 원문은 제외한다.
- 원격 CI·CodeRabbit은 푸시한 head별로 PR·Jira·Confluence에서 확인한다. 아직 결과가 없는 검사를 통과로 적지 않으며 main 병합·배포·공통 설정·NAS·키는 변경하지 않는다.
- [PR #110](https://github.com/IMHOJEONG/web-tech/pull/110)의 최초 head `fa9b4feed5e479ef09f28b6e9d301cee10086108`은 원격 CI 13개 job·문서·CodeQL 통과. CodeRabbit의 단독 재현 설정/명령 누락 1건에 맞춰 기존 보고서의 임시 설정·루트 명령·선행 조건과 production 구분만 보완한다. 검사 소스·공통 설정·시간 제한·retry는 그대로다. 문서의 실행 블록을 격리 export에서 검증하고 보고서/worklog 두 해시만 재등록한다.
- 문서의 shell 블록 그대로 재검증해 24 passed·32.2초·실패0을 확인했다. 최초 head의 Linux 상세 E2E도 214 passed·기존 skip2·retry0이었다. 원시 로그·trace를 첨부하지 않고 정제 결과만 기록한다. 후속 head의 CI·재리뷰는 별도 확인한다.
- 기준 38곳 중 원래 사용자 트리를 포함한 37곳의 HEAD·인덱스·dirty 집계 해시 일치, stash 0개 동일. 다른 세션의 Desktop 트리 변경은 별도로 관측했고 되돌리지 않았다. ignored 파일의 전수 동일 검증은 하지 않았다.

## Open Questions

최초 CI의 최종 요청 JSON은 원격 artifact로 남아 있지 않다. 실제 연결 중단인지, finish 기록 전의 읽기였는지는 과거 실행만으로 확정할 수 없다.

## Next

승인한 범위의 푸시·PR 준비 후 Linux 원격 CI·CodeRabbit을 확인한다. 로컬 성공을 과거 CI 최초 원인 확정이나 운영 배포로 표시하지 않는다. main 병합·배포는 별도 승인 전 수행하지 않는다.

## 2026-11-23 main 동기화 후속

- 사용자 요청에 따라 PR #110의 기존 head `8e54a666`에 최신 main `b841d21a`를 병합하며 테스트·목차·공개 검수 목록 4개 충돌을 정리했다. 기존 PR의 503 종료 증거 helper와 main의 실제 Link/prefetch 준비 변경을 함께 보존했다.
- [같은 검증 보고서의 후속 절](../../verification/resilience/2026-11-22-upstream-503-trace-readiness.md#2026-11-23-main-동기화-후속-검증)에 합성 export 준비·실행 명령 참조·최초 타입 준비 실패·최종 통과·미검증 범위를 추가했다. 단독 회귀24회·실제 Next 503 반복10회·상세 전체214개와 기존skip2개, retry0·타입·변경 소스 lint·포맷을 확인했다.
- 공개 검수 목록의 기존 main 251개와 PR 보고서2개를 누락·중복 없이 합쳤다. 문서4개의 최종 bytes는 재검수 대상이며, 승인 전 새 해시·병합 커밋·푸시·새 CI 성공을 기록하지 않는다. 동기화 커밋과 검증 문서 커밋은 분리한다.
- 새 구조·운영 계약·공통 지침은 변경하지 않았다. 이번에는 기존 완료 관측 구분을 재검증했으므로 새 ADR·중복 지식 문서를 만들지 않는다. 기존 Confluence 주제 문서를 재사용하고 실행 이력은 Jira·Confluence 조사 댓글에서 갱신한다.
- 원래 작업 트리·미커밋 변경·초안·stash·NAS·자격 증명은 그대로 유지한다. 별도 Git-free 합성 export에서만 빌드·E2E를 실행했고 원시 자료는 공개 Git 밖에 둔다. 과거 CI 최초 원인·별도 태블릿 간헐 실패는 미확정이며 main 병합·운영 배포는 이번 요청 범위에 없다.
