# Docs·Vuln Radar 초기 JavaScript 비용

## Summary

승인된 반응형 도식과 문서 7개를 `main`의 `5dc0e252`에서 분기한 P2 브랜치에 `9630878d`로 로컬 커밋했다. 다음 P2 항목은 [초기 JS 비용 검증](../../verification/performance/2026-11-25-initial-js-cost.md)과 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)에 연결한다.

## Changed

- 공개 Docs 목록·본문과 Vuln Radar Overview·Feed를 측정했다. 실제 운영 경로로 Vercel 분석 스크립트 대조를 확인했다.
- 검증 보고서와 정제 증거를 작성하고 현대화 계획에 연결했다.

## Notes

- Docs 12회, Vuln Radar 8회. Docs에서 실행 표본의 최대 비용은 공통 React DOM 런타임 파일이었다. Vercel 스크립트 두 개 차단은 일관된 개선 없이 검색 Drawer 첫 열기·포커스 복귀를 유지했다. 로딩 경로의 제품 변경 근거는 부족했다.
- 직전 커밋의 포맷·문서·공개 검사와 커밋 메시지 훅을 통과했다. 이 진단의 문서와 증거는 로컬에 있다. 공통 지침 변경 없음.
- 후속 하이드레이션은 `9630878d` 기준으로 격리 프로덕션 빌드 두 개를 비교했다. 기준 12회와 후보 12회의 검색 첫 열기·복귀, 이 중 8회의 전체 키보드 동작, 추가 모바일 메뉴 4회가 통과했다. 메뉴 렌더링 일부는 소폭 줄었지만 초기 준비 시간과 긴 프레임에 개선이 없었다. 제품 적용을 보류하고 두 서버를 종료했다.

## Open Questions

운영 Turbopack 환경에서의 컴포넌트별 시간과 필드 INP는 미검증이다.

## Next

Docs에서 다음 개선 후보를 고를 때 초기 JS 평가와 렌더링 외 실행의 기여를 따로 확인한다.
