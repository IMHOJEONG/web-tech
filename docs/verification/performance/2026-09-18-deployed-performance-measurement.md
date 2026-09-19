# 배포 상세 성능 기준선 측정

## Summary

heap-forge.app의 두 상세 페이지를 desktop/mobile-lab 조건에서 각각 3회 측정했다.

## Changed

- `apps/docs/scripts/measure-deployed-performance.mjs`: 읽기 전용 재현 스크립트.
- `docs/runbooks/docs-deployed-performance-measurement.md`: 수치, 조건, 한계, 후속 검증 절차.
- `docs/verification/artifacts/2026-09-18-deployed-performance.json`: 12회 원본 측정값.

## Notes

모두 200. 모바일 LCP 중앙값 4.076s / 3.340s. 일부 desktop CLS 약 1.0.
LCP 요소는 텍스트였다. 초기 article selector 오류를 수정한 재측정만 결과에 포함했다.
프로덕션 웹훅/원문 변경/캐시 초기화는 하지 않았다.

## Open Questions

서버 렌더링 구간별 비용과 최신 원문 반영 지연은 공개 응답만으로 확정할 수 없다.
MISS 헤더를 Data Cache 미사용으로 해석하지 않는다.

## Next

CLS 이동 요소와 모바일 텍스트 표시 지연 trace, 서버 span 계측,
승인된 테스트 글의 V1/V2/V3 신선도 실험 순으로 진행한다.
