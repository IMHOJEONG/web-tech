# 블로그 공통 목차 탐색 UI 개선

## Summary

개별 글의 제목 목록이 아니라 블로그 전체의 본문 목차 UI/UX를 개선했다. 현재 위치·계층·모바일 접기를 공통 위젯으로 정리하고, 최신 main의 heading ID·키보드 포커스 보완은 유지했다.

## Changed

- `Toc`을 summary, 링크 목록, 위치 구독 hook, 순수 판정 함수로 나눴다. 기존 CSS module 대신 앱의 Tailwind 토큰을 사용한다.
- 큰 데스크톱 박스를 얇은 가이드로 바꾸고, 실제 현재 항목에만 색과 `aria-current`를 적용했다. 제목 계층·긴 텍스트·항목 수를 표시한다.
- 모바일 기본 접기와 이동 후 focus를 유지하며 Escape 닫기를 추가했다. 빈 목차 영역은 숨긴다.
- 순수 함수와 실제 세 화면 회귀를 추가했다. 상세 결과와 처음 발생한 실패는 [검증 보고서](../../verification/accessibility/2026-11-14-article-toc-ux.md)를 원본으로 사용한다.
- [기존 UI 재사용 정책](../../architecture/docs-document-ui-reuse-policy.md)에 책임 경계를 추가했다. 데이터/공개 계약 변경이 아니므로 새 ADR은 해당 없음이다.
- 사용자 로컬 확인 후 [본문 목차 작성·연결 가이드](../../runbooks/docs-article-toc-guide.md), [합성 예제와 옵션 코드](../../../apps/docs/widgets/article-toc/examples/README.md)를 추가하고 기고 가이드에서 연결했다. 원격 H5/H6 미추출 등 현재 차이를 숨기지 않으며 실제 예제 파일을 읽는 회귀를 추가했다.

## Notes

[KAN-72](https://web-tech-service.atlassian.net/browse/KAN-72)에서 검토 중으로 추적한다. KAN-61의 제목 ID 정규화 수정과 다른 디자인 작업이며 그 동작을 보존한다. [Confluence 정제 요약](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=17793025)과 Jira의 3열 검증 표를 작성하고 재조회했다. 기능 브랜치의 검사 결과이며 main·운영 반영과 구분한다.

원래 작업 폴더가 오래된 detached 상태라 최신 main을 가져와 별도 작업 폴더/브랜치에 분리했다. 기존 진단 문서와 다른 미커밋·stash는 옮기거나 삭제하지 않았다. 설치는 frozen lockfile·ignore-scripts로 수행했고 새 도구/스킬을 승인하지 않았다. 공통 설정이나 패키지 버전은 바꾸지 않았다.

작성 가이드 후속 결과는 같은 Jira 검증 표와 [Confluence 답글](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=17825793)에 기록하고 재조회했다. Confluence 기존 댓글의 조회 HTML을 갱신 도구가 거절해 본문은 덮어쓰지 않고 답글로 보존했다. 예제 4개와 이를 포함한 전체 라이브러리 검사, 콘텐츠 검사에서 남은 기존 경고는 검증 보고서에 구분했다.

사용자가 목차 UI·가이드·예제만 공개 검수 후 작업별 커밋·푸시하도록 승인했다. 구현, 회귀 테스트, 작성 가이드·예제의 세 단위로 나누며 공개 문서·합성 예제의 최종 검수 해시를 함께 관리한다. 원시 자료와 기존 Atlassian 진단 작업은 제외한다. 기존 진단 파일 5개와 stash 10개의 식별자를 대조해 보존 여부를 확인하며 공통 설정·훅은 바꾸지 않는다.

## Open Questions

- 로컬 화면은 사용자 확인을 마쳤다. 원격 PR·main 반영 여부는 다음 승인 범위로 남는다.
- 원격 운영 글·실기기·스크린리더 추가 검증은 별도 범위로 진행할 것인가?

## Next

동일 브라우저 회귀와 로컬 화면 확인을 마쳤고 사용자도 로컬 확인 완료를 알렸다. 이번 승인 범위의 작업별 커밋·푸시 결과는 Jira·Confluence에서 실제 원격 SHA로 연결한다. PR 생성·main 병합·배포는 별도 승인 후 진행한다.
