# 사용자 탐색과 직접 URL 검사 분리

## Summary

사용자 이동 검사는 실제 Link 클릭으로, 직접 접근·새로고침과 서버 캐시 검사는 독립 문서 요청으로 구분했다. 기존 검증을 줄이지 않고 동일한 본문 assertion을 공유하는 카드 클릭 검사를 추가했다.

## Changed

- `article-detail.spec.ts`를 직접 URL 검사로 명명하고 기존 callback을 보존했다. 새 `article-navigation.spec.ts`는 실제 검색 결과 카드 클릭·문서 유지·본문 완성을 검사한다.
- 문서 사례와 본문·metadata 검증을 `article-fixtures.ts`로 옮겨 두 방식에서 공유한다.
- 혼합 prefetch 비교 spec을 client/direct 두 spec으로 나눴다. gate와 계측은 공통 scenario로 유지하고 각 spec에서 클릭/직접 URL 실행을 정한다.
- 게시 갱신·인증 검사는 새 서버 응답이 필요하므로 `direct URL cache` 역할로 유지한다. URL 중단 대조군도 삭제하지 않았다.
- [runbook](../../runbooks/docs-article-rendering-regression.md#이동-방식별-검사-역할)과 테스트 목록을 갱신했다. 결과는 [기존 보고서](../../verification/cache/2026-10-18-stream-termination-investigation.md#검사-역할-분리와-의도-보존)에 추가했다.

## Notes

핵심 48개와 전체 production 140개가 통과했다. 공유 assertion 429개 토큰·사례·기존 direct/reload callback·게시 화면 helper 본문이 이전 HEAD와 같음을 확인했다. 기존 128개에 카드 클릭 12개를 추가한 결과다. 스트림 로그 14회는 의도적 대조 및 직접 서버 캐시 검사에 그대로 남는다.

변경 TypeScript 8개 파일의 ESLint 및 docs 타입 검사가 통과했다. 문서·포맷 검사 결과와 원본 로그 해시는 검증 보고서 및 artifact에 연결한다.

출발 페이지 준비용 `page.goto()`는 클릭 spec에도 있다. 검증 대상 이동은 실제 Link 클릭이며 window UUID 유지와 document 요청 0건으로 구분한다. Router Cache 즉시 갱신·운영 사이트·다른 브라우저 엔진까지 검증한 것은 아니다. 기존 TCP 초안은 변경하지 않았다.

## Open Questions

ADR-0008의 운영 요청 생명주기 관측과 과거 CI 8건의 unknown 판정은 기존 범위로 남아 있다. 이 작업에서 앱 캐시·prefetch 동작이나 관측 계약을 바꾸지 않았다.

## Next

사용자 승인에 따라 테스트 정리는 `b37adeb`, 원인 계측·대조는 `9a39901`로 분리했다. 검증은 위 미커밋 작업 트리에서 수행한 결과이며, 문서도 별도 커밋한 뒤 `feature/docs`에 푸시해 해당 SHA의 CI를 확인한다. 기존 TCP 초안과 도식·검증 기록은 제외한다.
