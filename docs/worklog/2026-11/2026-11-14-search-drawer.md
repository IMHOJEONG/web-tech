# 반응형 검색 Drawer와 문서 자동완성

## Summary

사용자 요청으로 헤더 검색을 두 화면 공통 Drawer로 바꾸고 추천 검색어·문서 제목 자동완성·결과 미리보기를 로컬 구현했다. 최신 main 기반 독립 브랜치이며 기존 목차·초안·stash·NAS 작업은 변경하지 않는다.

## Changed

- 기존 공용 Base UI Sheet와 검색 입력·이동 훅을 재사용했다. URL/locale 조정·열림·폼/키보드·결과 표현·요청 수명을 분리했다.
- 별도 경량 API가 기존 검색 순서를 유지하면서 본문·HTML 없이 최대8개 문서 정보를 반환한다. 기존 `/api/search` 계약은 유지한다.
- debounce·이전 요청 취소·결과 경합 방지·IME·응답 검증·오류 재시도와 빈 결과, focus trap·Escape·트리거 복귀를 다룬다. 글 상세 Link prefetch는 끈다.
- [ADR-0031](../../architecture/adr-0031-docs-search-drawer.md), 검색 경험·API 정책을 함께 정리했다. [검증 보고서](../../verification/accessibility/2026-11-14-search-drawer.md)에 실제 실패와 후속 결과를 구분한다.

## Notes

초기 실제 폭80px 문제는 spacing token의 max-width 해석 충돌이었다. 공용 스타일을 넓게 고치지 않고 검색 Drawer만 명시 폭으로 제한했다. 기존 회귀의 landmark 선택자를 Portal 기반 dialog 안의 form으로 바꾸되 입력·history·중복 제출·대비 검사를 유지했다. 최종 로컬 검증은 보고서의 범위를 따른다.

[KAN-73](https://web-tech-service.atlassian.net/browse/KAN-73)과 [Confluence 후속](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817?focusedCommentId=17858571)에 로컬 구현·검증 상태를 연결했다. 새 의존성·인증값·운영 설정은 추가하지 않았다. 공개 검수 manifest는 사용자에게 최종 파일 공개 승인을 받은 뒤에만 갱신한다.

최종 로컬 검증은 lib369개, 개발 모드64개(기존 desktop 전용4skip), Production 모드40개가 통과했다. 빌드·타입·lint도 통과했고 기존 콘텐츠 경고2개는 변경하지 않았다. Production에서 추가로 보였던 요청은 결과 태그의 prefetch였으므로 실제 제출과 분리한 검사로 재검증했다. 원시 context·캡처는 비공개 로컬에 유지하며 별도 정제 artifact는 없다.

후속 신고에서 문서 링크에 포커스가 옮겨간 경우의 방향키 누락을 재현·수정했다. 입력창 선택과 링크 실제 포커스를 분리해 처리하고 강조를 강화했다. 최신 집중 검사36개·타입·lint 통과와 이전 Production/합성 원격 검사 범위 차이는 [검증 보고서](../../verification/accessibility/2026-11-14-search-drawer.md)에 남겼다. 사용자 확인용 개발 서버는 유지한다.

사용자가 화면을 확인하고 작업 단위 커밋·푸시를 요청했다. 경량 API·단위 검사, Drawer·브라우저 회귀, 정책·검증 문서로 나눈다. worktree의 기존 훅은 공개 검사 도입 전 내용이므로 인덱스·메시지·실제 전송 범위의 공개 검사를 명시적으로 수행해야 한다. 이 기록은 전송 완료의 증거가 아니며 실제 커밋·푸시 결과는 Jira·Confluence 요약에서 구분한다.

## Open Questions

native IME·실제 모바일 키보드·Safari·Firefox 검증과 큰 인덱스에서의 부하 계측은 남아 있다. 자동완성은 오타 교정이나 인기 문서 추천이 아니다.

## Next

최종 파일·해시 공개 승인을 받고 API·UI/회귀·문서의 3개 커밋을 푸시했으며 [PR #92](https://github.com/IMHOJEONG/web-tech/pull/92)를 생성했다. 이후 사용자가 main 병합·운영 배포도 요청했다. PR의 최신 head CI·리뷰 통과와 squash 사전검사 뒤 병합하고 같은 main SHA의 배포·운영 검증을 구분한다. 기존 초안·stash·NAS 작업은 계속 제외한다.

## 2026-11-15 리뷰 후속

CodeRabbit 인라인 3건을 실제 코드에서 재현했다. 반복 query의 세대 구분, 같은 URL 제출의 Drawer 닫힘, 공백 경로의 자동완성 전용 encoding을 보완했다. 닫을 때 조합 중이 아닌 입력을 재설정해 정규화 결과를 덮던 문제도 발견해 수정했다. 기존 history 회귀는 닫힘·재열기를 확인하면서 문서 재로드·중복 제출 검사를 유지한다. 실패·후속 결과와 명령은 [검증 보고서](../../verification/accessibility/2026-11-14-search-drawer.md)에 연결한다.

첫 head `d863c21f`의 CI·CodeQL·보안·Preview는 통과했지만 이 성공을 후속 수정본 검증으로 사용하지 않는다. 공개 검사에서 차단된 기존 고정 합성 헤더는 이미 있는 fixture 인증 헬퍼로 통일했고, 공개 예외나 검사기 완화는 추가하지 않았다. 승인 기록의 기존 목차 항목은 중복 추가가 아닌 해시 갱신으로 정리했다.
