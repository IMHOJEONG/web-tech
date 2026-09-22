# 캐시 모델 비교 조사

## Summary

Cache Components 도입 배경과 현재 블로그의 Previous Model 구현을 공식 자료에 대조해 독립 지식 문서로 정리했다.

## Changed

- `docs/knowledge/content-platform/next-cache-components-comparison.md` 추가.
- content-platform README에 비교 문서 연결.

## Notes

- 현재 설치 Next.js는 16.3.4이며 Cache Components는 활성화하지 않았다.
- 공식 설명, 코드에서 확인한 사실, 기대 효과와 미실행 실험을 구분했다.
- 모델 전환과 `max`/`expire: 0` 정책 선택은 별개임을 명시했다.
- 다국어 요청 경계, 실패 결과 캐싱, 목록/본문 일관성, 배포 검증을 전환 위험으로 정리했다.
- 문서만 변경했으며 이번 작업에서 빌드나 성능 테스트를 새로 실행하지 않았다.

## Open Questions

- 새 모델의 실질적인 응답 시간 개선과 유지보수 이점은 어느 정도인가?
- 원격 오류와 정상 빈 데이터를 구분한 뒤 어떤 함수까지 캐시할 것인가?

## Next

기존 통합 테스트를 기준으로 갱신 정책 비교를 먼저 하고, 별도 실험에서 Cache Components 도입 비용과 효과를 측정한다.
