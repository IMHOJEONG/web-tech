# Feed Skeleton 커밋과 hover 모션 개선

## Summary

Feed 로딩 Skeleton 변경과 검증 기록 8파일을 `e4e7dbf9`에 로컬 커밋했다. 이어서 Feed 결과 카드와 우선순위 필터·첫 로딩 실패 후 다시 시도 버튼의 hover 모션에서 동작 줄이기 설정을 반영했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

`motion-safe`일 때만 hover 이동과 위치 전환을 적용했다. 색상 전환은 두 모션 설정 모두에 적용한다. [검증 보고서](../../verification/accessibility/2026-11-21-vuln-radar-feed-hover-motion.md)

## Notes

- Skeleton 커밋 훅, 커밋 범위 공개 검수와 commitlint가 통과했다. 공유 목차의 Skeleton 항목만 커밋했다.
- 기존 [hover 모션 판단 기준](https://web-tech-service.atlassian.net/wiki/pages/19464193)을 Feed에 적용했다. 별도 지식 문서를 신설할 필요가 없었다. 공개 계약과 공용 컴포넌트 책임 변경은 없어 새 ADR은 필요하지 않았다.
- 이번 hover 변경과 검증 기록은 로컬 미커밋이다. 공통 지침 변경은 없다.
- KAN-83 검증 표와 Confluence 운영 댓글 v22를 갱신하고 재조회했다. [Confluence 운영 기록](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)

## Open Questions

실기기 검증은 미실행이다.

## Next

실기기 검증 시 동작 줄이기를 켜고 색상 피드백과 오류 후 복구를 확인한다.
