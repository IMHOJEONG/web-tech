# Feed 검색 레이블 커밋과 검색 랜드마크 적용

## Summary

검색 레이블·입력 설정과 정제 기록 10파일을 `52167f25`에 로컬 커밋했다. 이어서 검색어와 필터를 검색 랜드마크로 묶었다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

- Feed 필터 패널의 컨테이너를 `<search>`로 표현하고 화면의 `탐색 조건`을 `aria-labelledby`로 연결했다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-landmark.md)
- 검색 요청·입력 이벤트는 기존 계약을 따른다. 공개 API와 공유 컴포넌트의 책임을 변경하는 결정이 없어 새 ADR은 필요하지 않았다.

## Notes

- 레이블 커밋의 실제 훅과 커밋 범위 공개 검수·commitlint가 통과했다. 공유 목차의 해당 행만 커밋했다.
- 세 엔진 두 폭에서 검색 랜드마크 이름, 검색·필터·페이지 회귀가 통과했다. 랜드마크 코드와 문서는 로컬 미커밋이다. 공통 지침 변경은 없다.
- KAN-83 검증 표와 Confluence 운영 댓글 v17을 재조회했다. 별도 지식 v18에는 검색·필터 영역의 범위와 이름을 정하는 기준을 추가했다. 본문, 명세 링크와 운영 안내의 상위 경로를 확인했다. [Confluence 지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

실제 스크린리더의 랜드마크 목록에서 탐색하는 동작은 미검증이다.

## Next

스크린리더로 재검증할 때 랜드마크 목록에서 `탐색 조건`을 찾아 검색 입력으로 이동한다.
