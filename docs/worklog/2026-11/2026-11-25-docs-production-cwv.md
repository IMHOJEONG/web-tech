# Docs 프로덕션 이미지·한글 폰트 성능

## Summary

현대화 P2의 실제 Next 문서 성능을 측정하고, 화면 폭에 따라 바뀌는 가로 도식의 공간 예약을 수정했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)과 [검증 보고서](../../verification/performance/2026-11-25-docs-production-cwv.md)에 연결한다.

## Changed

- 도식 네 개의 실제 가로 치수를 `<picture>`의 `<source>`에서 전달한다. 합성 CI 이미지와 치수 검사를 실제 비율에 맞췄다.
- 기준 Next 빌드에서 24회 측정하고 공개 문서 8조건을 확인했다. 폰트 보정 대조군 12회에서는 측정상 개선이 없었다. Noto Sans KR을 유지한다.

## Notes

- 공개 도식 대조군에서 이미지 응답 전 1,193.42px, 응답 후 264.59px로 바뀌던 데스크톱 높이가 264.59px로 안정됐다. 로컬 수정본은 세 브라우저·두 폭에서 도식의 응답 전후 높이가 같았다. WebKit 모바일에서 화면 내 위치는 14px 이동했다.
- Docs 타입·대상 린트·MDX와 이미지 34개·CI 합성 콘텐츠 27개가 통과했다. 기준 및 수정의 실제 Next 프로덕션 빌드는 격리 사본에서 Webpack으로 실행했다.
- 소스 선택마다 공간 예약 수치가 필요하다는 판단을 [Confluence 현대화 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193)에 연결한다. 제품 변경과 측정 증거는 로컬 상태다. 공통 지침 변경 없음.

## Open Questions

운영 배포 후 전체 CLS와 필드 CWV는 아직 측정하지 않았다. 확인한 도식의 이미지 요청 우선순위는 별도 대조 항목이다.

## Next

현대화 계획의 초기 JavaScript·외부 스크립트 비용 항목은 동일한 페이지 조건을 출발점으로 삼는다.
