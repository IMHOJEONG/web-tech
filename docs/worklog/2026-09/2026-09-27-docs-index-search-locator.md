# 문서 인덱스 검색 E2E locator 충돌 수정

## Summary

헤더와 본문 검색 입력이 모두 `name="q"`를 갖게 된 뒤, 문서 인덱스 E2E의 전역 locator가 두 요소를 동시에 선택해 strict mode에서 실패했다. 본문 검색 폼을 먼저 지정하도록 수정했다.

## Changed

- [문서 인덱스 탐색 E2E](../../../apps/docs/e2e/docs-index-navigation.spec.ts): `main` 안의 `search` landmark로 범위를 좁혀 입력과 제출 버튼을 선택한다.

## Notes

- 실패 원인은 검색 기능의 응답이 아니라 테스트 선택자의 모호성이다. 헤더 검색의 `name="q"`는 일반 GET 제출에 필요한 속성이므로 제거하지 않았다.
- 수정 전 CI `36245303265`에서 strict mode violation을 확인했다.
- 두 이슈의 최종 변경을 함께 포함한 대상 E2E 27개 통과, 화면 크기 조건에 따라 6개 건너뜀.
- 원격 CI 재실행 및 배포 환경 검증은 아직 하지 않았다.

## Open Questions

없음.

## Next

배포 브랜치 CI에서 해당 E2E가 통과하는지 확인한다.
