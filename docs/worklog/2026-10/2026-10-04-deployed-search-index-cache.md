# 검색 인덱스 캐시 배포 환경 확인

## Summary

완료된 커밋 3개를 feature/docs에 푸시하고 새 Production에서 검색 응답과 Runtime Logs를 연결했다. 요청 간 인덱스 재사용과 일치하는 관측을 확인했다.

## Changed

- [배포 보고서](../../verification/cache/2026-10-04-deployed-search-index-cache.md)와 식별자 없는 측정 발췌를 추가했다.
- 캐시 ADR의 검증 범위와 배포 측정 runbook의 search-local 의미를 갱신했다.
- 기존 미커밋 복구 정책 문서는 변경하거나 커밋하지 않았다.

## Notes

첫 단계에서 검색 5회·페이지 HTML 4개·미인증 웹훅 2개를 확인했다. 후속 사용자 요청으로 정상 웹훅 1회와 이후 검색·목록·원격 상세 4회 재조회를 확인했다. 인덱스 생성과 원격 상세 조회 로그는 성공했다. 자세한 수치와 CI 상태는 보고서를 따른다. NAS SSH 주소의 DNS 해석 실패로 원문 변경은 수행하지 않았다.

## Open Questions

NAS 게시 시험에 사용할 접근 가능한 SSH 주소, 승인된 문서와 원복 계획이 필요하다.

## Next

테스트 문서 변경 후 backend 응답, 정상 webhook, 새 목록·검색·상세 응답을 대조하고 원복한다.
