# 문서 필터 준비 상태와 영문 간헐 실패 보완

## Summary

[KAN-42](https://web-tech-service.atlassian.net/browse/KAN-42). PR #67의 영문 정렬 링크 timeout을 별도 조사했다. 로딩 골격의 같은 필터를 완성 화면으로 오인하는 경로를 실제 HTML 전송으로 재현하고, 완성 결과 범위와 화면 상태를 확인하도록 테스트를 보완한다.

## Changed

- 인덱스 helper를 완성 결과가 있는 main으로 제한하고 summary 클릭 후 open을 검증한다.
- 태그/모음 해제와 정렬의 URL뿐 아니라 칩 수·선택 문구도 확인한다. 키보드 검사는 새 화면에서 열림·focus를 명시한다.
- ko/en의 실제 HTML 스트림 보류·골격 교체·완성 필터 정렬·Enter 회귀를 추가한다.
- [검증 보고서](../../verification/resilience/2026-10-27-docs-filter-readiness.md)에 실패 이력·재현 명령·한계를 구분한다. 앱/CI 기준이나 의존성은 바꾸지 않았다.

## Notes

최종 10반복 120개 통과, 관련 회귀 122개 통과·10 기존 조건부 제외이며 모두 재시도 0이다. 음성 대조에서 옛 selector가 새 회귀를 실패시키는 것도 확인했다. 자세한 중간 실패와 한계는 검증 보고서를 따른다.

로컬 작업 트리 보완이며 커밋/푸시·새 원격 CI·배포는 아직 하지 않았다. 기존 NAS/H1/대비 변경은 원래 작업 트리에 보존하며 기존 4파일 blob 일치를 확인했다. 타입·변경 파일 lint·포맷·문서 delta를 통과했고 실제 인덱스는 비워뒀다.

[KAN-42 댓글 10032](https://web-tech-service.atlassian.net/browse/KAN-42?focusedCommentId=10032)의 3열 표·검토 중 상태와 [Confluence](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817) v166의 이전 본문 보존·후속 항목 1개를 재조회했다. 아직 없는 원격 파일 permalink는 만들지 않았다.

## Open Questions

원격 첫 실패 trace가 없어 당시 DOM 교체 호출자는 미확정이다. 골격을 조작하지 않는 수정과 로컬 재현 결과를 그 한계와 함께 기록한다.

## Next

커밋·푸시 승인 후 같은 소스로 원격 CI를 재검증하고 로컬 원본의 permalink를 연결한다.

## 2026-10-28 독립 PR 준비

핵심 36개·관련 65개가 재시도 없이 통과했고 기존 조건부 제외는 10개다. 타입 검사와 변경 파일 lint도 통과했다. native fallback open의 hydration 경고 관측은 검증 보고서에 별도로 남겼으며 전체 경고가 사라졌다고 주장하지 않는다.

최신 main `e2126a40` 기반으로 필터 회귀만 분리한다. 기존 PR #67의 hydration 설명 문서 전체를 복사하지 않고 [필터 준비 상태 지식](../../knowledge/docs-app/streamed-index-readiness.md)으로 후속 교훈을 분리했다. 원본 작업 트리의 15파일은 유지한다. 새 Node 24.22.1 기준 결과는 검증 보고서의 후속 구역에 기록하며 기존 검사 기준을 완화하지 않는다.
