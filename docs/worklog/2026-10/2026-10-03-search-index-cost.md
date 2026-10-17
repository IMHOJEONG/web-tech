# 검색 인덱스 비용 점검

## Summary

성능 관찰 보고서만 `6798430`으로 커밋했다. 푸시는 하지 않고 다음 우선순위인 검색 인덱스 비용을 확인했다.

## Changed

- [측정 보고서](../../verification/performance/2026-10-03-search-index-cost.md)에 실행 명령·로컬 반복·합성 증가 시험·Production 단계 로그를 분리해 기록했다.
- 검증 목록과 월별 목록에 연결했다. 검색 실행 코드·캐시·환경 설정은 변경하지 않았다.

## Notes

Node 24 로컬 공개 문서 10개와 Production 읽기 요청 3개를 측정했다. Runtime Logs의 최초 빈 조회는 수집 지연 후 재조회에서 확인됐다. 별도 복구 정책 작업은 수정하지 않았다.

## Open Questions

Production cold/warm 및 동시 요청 비용, 더 큰 실제 corpus, 게시 갱신과 연동된 캐시의 유효성은 미검증이다.

## Next

후속 [로컬 인덱스 재사용·무효화 검증](2026-10-03-local-search-index-cache.md)을 완료했다. 운영 배포 후에는 개선 전후 비용을 다시 비교한다.
