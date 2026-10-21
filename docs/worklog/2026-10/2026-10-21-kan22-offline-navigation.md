# KAN-22 main 기준 상세 이동 검사 보완

## Summary

main `5b0faa2`에서 새 브랜치 `codex/docs-kan22-offline-navigation`을 만들었다. 병합 후 오프라인 job의 URL 5초 검사 실패를 조사하고, 서버 응답 대기와 이동 후 본문 검증을 분리했다. 함께 발견한 최종 `Test`의 오프라인 집계 누락도 보완했다.

## Changed

- 공개 검색 후속 진단의 선택자 충돌을 확인하고 읽기 전용 `apps/docs/scripts/verify-public-search.ts`를 보관했다. 서비스 UI나 번역은 바꾸지 않았다.
- 이미지 대체 여부·decode 검사를 유지하며 실제 Link 클릭을 관측하는 테스트 헬퍼를 분리했다. 앱 UI·렌더러·의존성은 바꾸지 않았다.
- 정상 RSC 전달 지연과 실제 HTTP 503 대조군을 추가했다. URL뿐 아니라 본문·HTTP 오류·동일 문서 유지·전체 reload 부재를 확인한다.
- CI `Test`에 `offline-reading`을 포함하고 shell 결과 64조합을 검사한다. 전체 timeout과 retries는 그대로다.
- [검증 보고서](../../verification/resilience/2026-10-21-kan22-offline-navigation.md)와 [선별 증거](../../verification/artifacts/2026-10-21-kan22-offline-navigation.json)를 추가했다. 검사 계약 보완이며 앱 구조·공개 계약 변경이 아니므로 새 ADR은 만들지 않았다.

## Notes

공개 검색 후속 조사: 한국어의 열기·제출 버튼 이름이 같아 패널을 연 뒤 원래 role locator가 두 대상을 가리켰다. 실제 토글은 열린 상태인데 검사에서 실패로 오판했다. 헤더 토글 계약으로 한정한 전체 흐름 20개(Chromium headless·Chrome headed, 두 언어·두 화면)와 모호한 읽기 거부 10회를 확인했다. 상세 근거와 초기 진단 정정은 [공개 검색 원인 분리](../../verification/resilience/2026-10-21-kan22-offline-navigation.md#공개-검색-실패의-원인-분리), [선별 증거](../../verification/artifacts/2026-10-21-public-search-selector-investigation.json)에 남겼다. 최종 TypeScript·lint도 통과했으며 앱 빌드·CI·배포·커밋·푸시는 이번 조사에서 새로 실행하지 않았다. 기존 병합 후 기록과 stash는 보존했다. 구조·공개 계약 변경이 아니므로 새 ADR은 만들지 않았다.

기록 마감: Jira KAN-22의 기존 댓글 `10011`에 3열 정정 표를 추가하고 Confluence v32를 재조회했다. 이전 실패 이력·다른 작업의 최신 본문을 보존했고, 검색 조사 결론·20개 흐름·10개 대조군과 미커밋 범위를 확인했다. 후속 기록 리뷰 전까지 Jira는 검토 중으로 유지하며 새 원격 문서 permalink를 만들지 않았다. 문서·포맷·증거 해시·diff 검사도 통과했다.

아래 검사 결과와 미커밋·미푸시 표기는 최초 로컬 검증 시점의 기록이다. 이후 사용자 승인에 따라 CI 집계 수정은 `29278e3`, 이동 회귀 테스트는 `1d6674f`로 각각 커밋했다. 문서·증거는 세 번째 독립 커밋으로 분리한다. 소스 해시는 최초 검증과 동일하다.

전체 오프라인 22개, 주요 시나리오 반복 18개, 저장소 63개와 docs TypeScript·변경 테스트 lint를 통과했다. 원래 CI의 서버 지연 원인은 trace 부재로 미확정이다. 로컬 첫 방문/재방문 비교와 정상 응답 전달 보류 대조군은 그 한계를 대신하지 않는다. 상세 수치는 보고서에서 확인한다.

추적은 기존 [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22)와 [Confluence 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)를 갱신한다. 원래 실패 기록은 보존하고 로컬 변경·원격 검증을 구분한다. 기존 stash·TCP 작업과 다른 브랜치는 건드리지 않았다.

KAN-22를 `검토 중`으로 전환하고 댓글 `10011`의 과거 실패 본문을 보존한 채 3열 후속 표를 추가했다. Confluence v27도 기존 전체 본문을 보존하고 조사 요약을 추가했음을 재조회했다. 존재하지 않는 원격 문서 링크는 만들지 않았다. 미커밋 파일을 읽는 문서 검사 어댑터·변경 파일 포맷·증거 해시·`git diff --check`를 통과했으며 인덱스는 비어 있다. 검증 전용 detached 작업 트리는 제거했고 테스트 포트 3018의 listener는 남지 않았다.

## Open Questions

현재 검색 후속 조사의 원인은 검사 선택자 충돌로 확인했다. 아래 22시 기록의 “상호작용 실패”는 당시 오판을 보존한 것이며, 서비스 장애 판단은 위 후속 결과로 정정한다. 처음 CI의 물리적 지연 원인·첫 DOMContentLoaded 클릭의 문서 교체·실기기 전체 동작은 여전히 별도 한계다.

22시 KST 후속: 사용자 승인으로 PR #52를 main `527d4b0`에 병합했다. 같은 SHA의 CI 13개 job·문서·보안 검사와 Production READY·공개 alias 연결·HTTP 점검을 확인했다. 공개 자동화 브라우저의 검색 상호작용 검사는 실패했으므로 운영 검증 전체를 통과로 닫지 않았다. [병합 후 결과](../../verification/resilience/2026-10-21-kan22-offline-navigation.md#pr-52-main-병합-후-확인)와 [선별 증거](../../verification/artifacts/2026-10-21-kan22-postmerge-verification.json)에 초기 실패·미검증 범위를 남긴다. 이미 병합한 브랜치를 재사용하지 않고 최신 main 기반 `codex/docs-kan22-postmerge-verification`에 기록만 미커밋으로 분리했다. 앱 코드·NAS·기존 stash는 변경하지 않았다.

후속 원격 반영: 세 커밋을 푸시해 [PR #52](https://github.com/IMHOJEONG/web-tech/pull/52)를 만들었다. 첫 head `50c08c3`의 [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/39594550825)는 13개 job과 최종 `Test` 모두 통과했고 오프라인은 실제 22개 통과였다. 같은 head의 문서·CodeQL·미리보기도 성공했다. 리뷰의 상태 표현 모순 1건을 문서만의 네 번째 커밋으로 보완한다. 앱·테스트 소스는 바꾸지 않았으며 최종 head의 CI를 다시 확인한다.

최초 CI에서 실제로 느렸던 단계와 원격 trace 보관 정책은 후속 확인이 필요하다. 이번 기능 검사에 허용한 서버 대기 시간을 사용자 성능 목표와 혼동하지 않는다.

## Next

초기 계획이던 커밋·푸시·PR 및 이후 승인된 main 병합·배포 확인은 앞선 단계에서 수행했다. 위 검색 조사 마감과 22시 기록의 미커밋·미푸시는 당시 관측 상태다. 후속 사용자 승인에 따라 병합 후 검증 기록과 검색 검사 도구·문서 정정을 두 커밋으로 분리해 푸시하고 main 대상 PR을 준비한다. 최종 head의 원격 CI는 새로 확인해 PR·KAN-22·Confluence에 연결하며, main `527d4b0`의 성공으로 대신하지 않는다. 새 PR의 병합·운영 배포는 이번 범위가 아니다. 서비스 UI 변경이나 강제 재배포는 이 선택자 오판을 해결하는 데 필요하지 않다.
