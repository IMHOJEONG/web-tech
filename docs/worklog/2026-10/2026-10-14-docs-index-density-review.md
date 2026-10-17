# 문서 목록 순서와 밀도 개선의 1차 검토

## Summary

UI/UX 분석의 첫 개선 과제인 `/docs`와 검색 결과의 목록 순서·밀도를 검토했다. 개선 전 측정값, 구현 순서와 완료 기준을 연결했으며 화면 구현은 미착수다.

## Changed

- [검색 경험 정책](../../architecture/docs-search-experience-policy.md#문서-목록-순서와-밀도-보완-검토)에 목록 우선 순서·보조 정보·카드·회귀 검증의 단계별 기준을 추가했다.
- [검토 보고서](../../verification/accessibility/2026-10-14-docs-index-density-review.md)와 [기준선 artifact](../../verification/artifacts/2026-10-14-docs-index-density-baseline.json)에 앞선 공개 측정을 보존했다.
- 기존 `/docs` TODO에 순차 실행 항목을 추가하고 검증·증거·월별 색인을 갱신했다.

## Notes

기존 미커밋 작업을 보존하며 문서만 보완했다. `pnpm validate:docs`와 `git diff --check`가 통과했고 기준선 네 조건이 원본 측정값과 일치함을 확인했다. 서식 검사에서 지정된 정책·보고서 두 파일을 정리했다. 실제 배포 SHA, 사용자 행동과 개선 후 효과는 미검증이다. ADR-0003의 화면 역할과 ADR-0012의 URL·태그·모음 계약은 유지하며 기존 정책을 확장하므로 새 ADR을 만들지 않았다.

## Open Questions

보조 탐색을 목록 뒤에 둘지 펼침 영역에 둘지는 단계별 구현 화면에서 확인한다. 첫 제목 위치의 제안 목표는 기본 글자·접힌 필터 조건에서 재측정하며 큰 글자 환경에 고정 높이를 강제하지 않는다.

## Next

목록 순서 구현부터 진행한 뒤 같은 두 URL·viewport로 전후를 비교한다. 이 단계가 확인된 후 보조 정보와 카드 밀도를 순서대로 보완한다. 상세 목차·분류 체계·drawer는 후속 과제로 유지한다.
