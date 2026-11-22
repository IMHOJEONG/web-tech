# Feed hover 커밋과 페이지 이동 포커스 개선

## Summary

카드·버튼 hover 모션과 검증 기록 10파일을 `80c135a3`에 로컬 커밋했다. 이어서 키보드로 Feed 페이지를 넘길 때 포커스가 문서로 빠지는 문제를 확인하고 수정했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

- 로딩 중에도 같은 페이지 탐색 버튼을 유지한다. 대기 중과 경계 페이지는 `aria-disabled`로 표시하고 키보드·클릭 동작을 막는다. 비활성 버튼은 Tab 순서에서 건너뛴다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-pagination-focus.md)
- 기존 통합 실행기의 페이지 표시 단언 세 곳을 현재 보이는 텍스트에 맞췄다. 실행기의 기존 로컬 변경은 계속 보존했다.

## Notes

- hover 커밋 훅, 커밋 범위 공개 검수와 commitlint가 통과했다.
- WebKit 기본 Tab에서 역방향 이동 확인이 실패했다. 버튼까지 순회하는 Option+Tab 계열을 사용한 뒤 두 폭에서 왕복이 확인됐다.
- 페이지 포커스 변경은 로컬 미커밋이다. 공개 API와 공유 컴포넌트 계약 및 공통 지침에 새 결정이 없어 ADR은 추가하지 않았다.
- KAN-83 검증 표와 Confluence 운영 댓글 v23을 갱신하고 재조회했다. 별도 지식 v22에서 버튼 포커스 유지 기준과 근거 링크, 운영 안내 탐색 경로를 확인했다. [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)

## Open Questions

실제 Safari 및 스크린리더에서 버튼과 비활성 상태를 어떻게 전달하는지 추가 확인할 수 있다.

## Next

실기기 검증에서 키보드로 다음·이전 버튼을 실행하고 대기 중과 경계 페이지의 포커스와 발화를 확인한다.
