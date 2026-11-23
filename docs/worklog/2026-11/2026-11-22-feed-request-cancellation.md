# Feed 검색 요청의 취소 신호 연결

## Summary

사용자 요청으로 다음 현대화 후보인 Feed 요청 취소를 적용했다. 검색·필터 교체와 화면 이탈의 Query signal을 fetch까지 전달하고 8초 제한·기존 오류 분류를 유지했다. VoiceOver는 사용자 요청으로 생략했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

제품 3파일에서 queryFn·searchFeed·getJson에 선택적 신호를 연결했다. AbortSignal.any로 호출자와 timeout을 결합하고, 호출자 취소의 원래 이유와 일반 오류의 cause를 보존한다. 실제 API의 네이티브 브라우저 검증 스크립트를 추가했다. [조건·결과·캐시 의미와 한계](../../verification/integration/2026-11-22-feed-request-cancellation.md)

## Notes

빌드·타입·변경 소스 린트와 기존 테스트 36개가 통과했다. 세 엔진의 API 취소·오류 36조건과 실제 전후 앱의 세 엔진·두 폭 12조건을 확인했다. 이전 검색의 늦은 완료는 현재 화면을 덮어쓰지 않았고 취소는 재시도하지 않았다. 미완료 요청의 재방문은 새 요청이 필요하며 완료된 신선한 캐시는 유지된다.

기존 client.ts의 미커밋 timeout 현대화와 다른 작업을 보존했다. 기준 소스를 저장소 밖에 복사하고 임시 Vite load hook으로 비교 빌드를 구성했으며 제품을 되돌리지 않았다. 초기 harness의 이전 카드 유지 가정과 빌드 cwd/CSS 차이는 실제 갱신 UI와 동일 앱 cwd·CSS 해시로 보완했다. 원시 자료·합성 서버·앱 비교 harness는 저장소 밖에 보관한다.

시간 제한/호출자 취소의 구분과 Query 캐시 의미는 기존 저장소 지식과 Confluence의 같은 주제 문서에 반영했다. [취소 지식 본문 v7](https://web-tech-service.atlassian.net/wiki/pages/20676655#호출자-취소와-Query-캐시-수명을-함께-검증하기)의 본문·원본 근거 링크와 상위 현대화 지식→운영 안내 경로를 재조회했다. [KAN-83 요약 표](https://web-tech-service.atlassian.net/browse/KAN-83?focusedCommentId=10127)와 [운영 진행 댓글](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)에 적용·검증·미검증 범위를 갱신했다. 새 공개 HTTP·URL·캐시 시간 설정이나 공용 UI 책임의 변경이 없어 ADR은 추가하지 않았다. 공통 지침·의존성·lockfile의 로컬·원격 변경은 없다.

## Open Questions

최초 검증은 로컬 미커밋 적용본을 기준으로 했다. 운영 배포·실서비스 API/DB·실기기·실제 Safari 앱과 성능 개선량은 미검증이다. VoiceOver 발화·로터는 생략으로 미검증이다. 클라이언트 중단은 서버 작업 취소·롤백을 입증하지 않는다.

사용자가 후속으로 커밋과 다음 작업 진행을 요청했다. 취소 변경과 재현 스크립트·정제 기록, 앞서 보류한 화면 분리 실험의 기록을 커밋 범위로 정했다. 공유 목차와 기존 미추적 지식 파일은 해당 항목·새 취소 절만 부분 스테이징하고 다른 초안과 원시 자료는 제외한다. 이 요청은 푸시·게시·배포 승인을 포함하지 않는다.

## Next

다음 기존 후보인 긴 Feed 목록의 렌더링 지연은 실제 비용부터 측정하고 적용 여부를 판단한다. 기본 25개 목록에 content-visibility를 바로 추가하지 않는다.
