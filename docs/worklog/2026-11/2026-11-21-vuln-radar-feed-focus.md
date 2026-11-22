# Vuln Radar Feed 검색 입력의 포커스 표시 개선

## Summary

`9c55b335` 기준으로 Feed 검색 입력의 키보드 포커스 표시를 개선했다. 실제 `/feed`에서 변경 전후 각각 10조건으로 확인했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

- 검색 입력에 `:focus-visible`의 2px 실선과 2px 간격을 적용했다. 일반 모드에는 테마 색, 강제 색상에는 `CanvasText`를 사용한다.
- 화면 표시의 국소 변경이다. 공개 계약이나 컴포넌트 책임이 바뀌지 않아 새 ADR이 필요하지 않다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-focus.md)

## Notes

- 키보드 포커스, 검색·필터·페이지 이동과 뒤로 가기를 확인했다. 로컬 API 통합 검사 26그룹과 앱 테스트 36개가 통과했다. 검증 조건과 도구의 한계는 보고서에 기록했다.
- 강제 색상에서 그림자가 사라지는 동작과 시스템 색 확인 기준을 기존 Confluence 지식에 보강했다. [키보드 포커스 판단 기준](https://web-tech-service.atlassian.net/wiki/pages/19464193#강제-색상에서-키보드-포커스-표시하기)
- KAN-83 검증 표와 Confluence 운영 기록 v15를 갱신하고 재조회했다. 별도 지식 v16의 본문과 근거, 운영 안내의 상위 경로를 확인했다. [Confluence 운영 기록](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)
- 공통 지침 변경은 없다. 코드와 검증 문서는 로컬 미커밋이다.

## Open Questions

Windows 사용자가 설정한 실제 강제 색상 테마에서의 표시는 미검증이다.

## Next

실기기에서 재검증할 때 Tab 이동으로 실제 outline의 색과 인접 배경을 확인한다.
