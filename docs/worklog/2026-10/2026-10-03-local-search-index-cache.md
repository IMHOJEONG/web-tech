# 로컬 검색 인덱스 재사용과 게시 갱신

## Summary

공개 성능 보고서의 실제 배포·요청 ID를 placeholder로 바꾸고 로컬 검색 인덱스 캐시를 추가했다. 구현·검증을 별도 커밋으로 묶으며 푸시·운영 배포는 후속 작업이다.

## Changed

- 로컬 로딩을 별도 모듈로 분리하고 Production Data Cache·문서 내용 digest·독립 태그를 연결했다. 개발 서버는 기존 로딩을 유지한다.
- 인증된 기존 webhook이 원격 콘텐츠와 로컬 인덱스 태그 모두 즉시 만료하도록 확장했다. 응답 계약과 토큰은 그대로다.
- 순위 계산·원격 실패 fallback·요청 계측은 캐시 밖에 유지했다.
- [ADR-0011](../../architecture/adr-0011-local-search-index-cache.md), 기존 정책·검사 절차와 [검증 결과](../../verification/cache/2026-10-03-local-search-index-cache.md)를 연결했다.

## Notes

라이브러리 204개와 검색 캐시·전체 앱 production 통합이 통과했다. 처음 검색 캐시 테스트에서 발견한 fixture 검색어 충돌은 조건을 좁혀 해결했다. 별도 복구 정책 미커밋 변경을 보존했다. 공개 Git 기록의 과거 커밋까지 ID를 삭제하거나 이력을 재작성하지는 않았다.

## Open Questions

실제 배포에서 cold/warm 표본·게시 갱신·재배포 cache key 분리는 미검증이다.

## Next

배포 후 동일 요청의 단계 로그를 비교하고 실제 NAS 게시 → webhook → 목록/검색 갱신을 확인한다. 로컬 문서 수정은 새 배포가 필요하다.
