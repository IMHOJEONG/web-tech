# KAN-22 main 기준 상세 이동 검사 보완

## Summary

main `5b0faa2`에서 새 브랜치 `codex/docs-kan22-offline-navigation`을 만들었다. 병합 후 오프라인 job의 URL 5초 검사 실패를 조사하고, 서버 응답 대기와 이동 후 본문 검증을 분리했다. 함께 발견한 최종 `Test`의 오프라인 집계 누락도 보완했다.

## Changed

- 이미지 대체 여부·decode 검사를 유지하며 실제 Link 클릭을 관측하는 테스트 헬퍼를 분리했다. 앱 UI·렌더러·의존성은 바꾸지 않았다.
- 정상 RSC 전달 지연과 실제 HTTP 503 대조군을 추가했다. URL뿐 아니라 본문·HTTP 오류·동일 문서 유지·전체 reload 부재를 확인한다.
- CI `Test`에 `offline-reading`을 포함하고 shell 결과 64조합을 검사한다. 전체 timeout과 retries는 그대로다.
- [검증 보고서](../../verification/resilience/2026-10-21-kan22-offline-navigation.md)와 [선별 증거](../../verification/artifacts/2026-10-21-kan22-offline-navigation.json)를 추가했다. 검사 계약 보완이며 앱 구조·공개 계약 변경이 아니므로 새 ADR은 만들지 않았다.

## Notes

아래 검사 결과와 미커밋·미푸시 표기는 최초 로컬 검증 시점의 기록이다. 이후 사용자 승인에 따라 CI 집계 수정은 `29278e3`, 이동 회귀 테스트는 `1d6674f`로 각각 커밋했다. 문서·증거는 세 번째 독립 커밋으로 분리한다. 소스 해시는 최초 검증과 동일하다.

전체 오프라인 22개, 주요 시나리오 반복 18개, 저장소 63개와 docs TypeScript·변경 테스트 lint를 통과했다. 원래 CI의 서버 지연 원인은 trace 부재로 미확정이다. 로컬 첫 방문/재방문 비교와 정상 응답 전달 보류 대조군은 그 한계를 대신하지 않는다. 상세 수치는 보고서에서 확인한다.

추적은 기존 [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22)와 [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)를 갱신한다. 원래 실패 기록은 보존하고 로컬 변경·원격 검증을 구분한다. 기존 stash·TCP 작업과 다른 브랜치는 건드리지 않았다.

KAN-22를 `검토 중`으로 전환하고 댓글 `10011`의 과거 실패 본문을 보존한 채 3열 후속 표를 추가했다. Confluence v27도 기존 전체 본문을 보존하고 조사 요약을 추가했음을 재조회했다. 존재하지 않는 원격 문서 링크는 만들지 않았다. 미커밋 파일을 읽는 문서 검사 어댑터·변경 파일 포맷·증거 해시·`git diff --check`를 통과했으며 인덱스는 비어 있다. 검증 전용 detached 작업 트리는 제거했고 테스트 포트 3018의 listener는 남지 않았다.

## Open Questions

최초 CI에서 실제로 느렸던 단계와 원격 trace 보관 정책은 후속 확인이 필요하다. 이번 기능 검사에 허용한 서버 대기 시간을 사용자 성능 목표와 혼동하지 않는다.

## Next

승인된 후속 단계는 세 커밋 푸시와 main 대상 PR 준비, 동일 head SHA의 Linux 오프라인 job·최종 `Test`·전체 CI 확인이다. 실제 원격 결과와 실행 URL은 PR·KAN-22·Confluence에 연결하며, 최초 로컬 보고서의 미검증 기록을 당시 원인 확정이나 배포 성공으로 바꾸지 않는다. main 병합과 운영 배포는 이번 요청 범위가 아니다.
