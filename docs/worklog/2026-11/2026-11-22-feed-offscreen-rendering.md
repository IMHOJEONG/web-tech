# 요청 취소 커밋과 Feed 렌더링 지연 실험

## Summary

사용자 요청으로 요청 취소 코드·검사·정제 기록과 앞선 화면 분리 실험 기록을 `35c6b59e`에 로컬 커밋했다. 다음 후보인 화면 밖 카드의 렌더링 지연을 비교했고 현재 25개 목록에는 적용을 보류했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

제품 소스를 편집하지 않고 실제 프로덕션 빌드에 실험 CSS만 주입했다. 후속 변경은 [검증 보고서](../../verification/performance/2026-11-22-feed-offscreen-rendering.md)·정제 artifact·목차·작업 기록이다. 기존 다른 미커밋과 원시 자료를 보존했다.

## Notes

커밋 16파일은 실제 포맷·문서·publication·commitlint 훅과 커밋 범위 재검수가 통과했다. 첫 scope vuln-radar가 허용 목록에 없어 vuln-radar-app으로 정정했으며 검사를 우회하지 않았다. 공유 목차·미추적 지식 파일은 해당 항목·새 취소 절만 부분 스테이징했다. 나머지 원문은 작업 트리에 보존했다. 인덱스의 지식 절 마지막 빈 줄·중복 제목은 의도한 범위를 다시 검토해 정리했다.

실제 앱 빌드와 25개 카드의 크기 보정, CPU 4배 20회 초기/스크롤 trace, 세 엔진·두 폭·기준/후보 12조건을 확인했다. 초기 Layout 절약에 비해 스크롤 Layout 작업이 추가됐고 LCP의 일관된 이득을 관측하지 못했다. 연속 키보드 25개 링크와 페이지 이동은 통과했다. 원시 trace·측정 harness·합성 서버는 저장소 밖에 보관했다.

미뤄진 렌더링 비용과 초기 개선의 차이를 [기존 Confluence 현대화 지식 v29](https://web-tech-service.atlassian.net/wiki/pages/19464193#작은-목록의-렌더링-지연은-전체-읽기-비용까지-비교하기)에 정리하고 본문·원본 근거 링크·상위 운영 안내 경로를 재조회했다. [취소 지식 v8](https://web-tech-service.atlassian.net/wiki/pages/20676655#호출자-취소와-Query-캐시-수명을-함께-검증하기)에도 실제 로컬 커밋 상태를 연결했다. [KAN-83의 3열 요약 표](https://web-tech-service.atlassian.net/browse/KAN-83?focusedCommentId=10127)와 [운영 진행 댓글](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)에 결과·한계·다음 후보를 갱신했다. 제품의 새 구조·공개 계약을 적용하지 않아 ADR을 추가하지 않았다. 공통 지침·의존성·lockfile의 로컬·원격 변경은 없다.

## Open Questions

최초 검증은 로컬 미커밋 기록으로 마감했다. 푸시·PR·운영 배포·실서비스 성능·실기기·실제 Safari 앱은 미검증이다. VoiceOver는 사용자 요청으로 생략·미검증이다. Command-F 도구막대 자체는 검증하지 않았으며 window.find 결과와 구분한다.

사용자가 후속으로 렌더링 실험 검증 기록의 커밋과 개발 서버 중지를 요청했다. 보고서·정제 artifact·작업 기록과 공유 목차의 이번 항목만 커밋 범위로 정했다. 기존 다른 미커밋·원시 trace·앱 코드는 제외한다. 현재 저장소 cwd와 실행 명령을 확인한 Docs 개발 서버·합성 콘텐츠 서버, Vuln Radar 개발 서버·합성 API 서버가 중지 대상이다. 커밋과 종료 확인 결과는 위 KAN-83 요약 표와 운영 진행 댓글에서 추적한다. 커밋·중지는 새로운 개념을 추가하지 않으므로 기존 지식의 원본 상태 연결만 갱신한다.

## Next

요청한 기록 커밋 후 확인한 개발 서버를 종료한다. CSP 조사는 다음 후보로 남기며 이번 마감에서는 시작하지 않는다.
