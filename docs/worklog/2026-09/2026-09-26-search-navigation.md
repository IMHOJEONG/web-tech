# 헤더·본문 검색 제출 방식 통일

## Summary

2번 공용 본문 검증 변경을 `875ab3a`로 커밋한 뒤 사용자 지정 순서의 4번을 진행했다. 기존의 헤더 클라이언트 이동·본문 전체 GET reload 차이를 없앴다.

## Changed

- `useSearchNavigation`으로 locale-aware 이동, 입력 정규화, 동일 URL·IME·pending 제출 방지를 공유한다.
- `SearchSubmitButton`으로 아이콘형·텍스트형 로딩 UI를 분리하고 번역·폭 유지·reduced motion을 공통 적용했다.
- native 폼의 action·GET·q 계약은 보존하며 새 검색의 필터 초기화와 history 동작을 유지한다.
- [검색 정책](../../architecture/docs-search-experience-policy.md), [반복 검사 절차](../../runbooks/docs-responsive-browser-device-checklist.md#검색-제출-회귀-검사)와 TODO를 갱신했다. ADR-0007의 입력 계약은 대체하지 않았다.

## Notes

[검증 보고서](../../verification/content/2026-09-26-search-navigation.md)에 51개 E2E·production build 결과와 초기 실패를 기록했다. 이번 검색 변경은 미커밋이며 push·운영 배포하지 않았다. 기존 계측·사용자 변경은 보존했다.

## Open Questions

JavaScript 비활성 환경의 전체 `/docs` 스트리밍 지원과 실제 보조기기 낭독은 별도 검증이 필요하다.

## Next

5번 ADR-0007에 실제 배포 식별자와 배포 후 검증 기록을 연결한다. 이번 로컬 테스트나 빌드를 운영 검증으로 대신하지 않는다.
