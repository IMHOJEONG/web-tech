# Noto Sans KR 적용과 비교 검증

## Summary

사용자 선택에 따라 한국어 본문을 Noto Sans KR로 교체하고 Pretendard와 가독성·로딩·LCP·CLS를 비교했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## Changed

Noto WOFF2·OFL을 추가하고 fonts.ts와 실제 locale layout을 연결했다. 공식 고정 소스의 문자 범위를 기존 본문 지원 범위에 맞춰 축소했다. 본문 CSS 변수와 자체 호스팅·선로딩 정책을 사용한다. [범위·결과·재현 절차](../../verification/performance/2026-11-22-docs-noto-sans-kr.md)

## Notes

폰트 전체를 WOFF2로 바꾼 실험은 약 3.91MB였고 적용한 부분집합은 약 1.05MB다. 한글 완성형 전체와 표본 윤곽을 검증했다. 48회 성능 비교, 세 엔진·두 폭의 가독성 표본, 제품 타입·린트가 통과했다. 원본과 부분집합의 문자 차이와 fallback·CLS 증가를 보고서에 기록했다.

가독성 우열을 사용자 읽기 실험으로 평가하지 않았다. 캡처와 원시 실행 자료는 저장소 밖에 보관했다. 기존 다른 미커밋 작업을 보존했고 앱 의존성·공통 지침 변경은 없다. 공개 계약·라우팅의 새 결정이 없어 ADR을 추가하지 않았다.

[KAN-83 요약 댓글](https://web-tech-service.atlassian.net/browse/KAN-83?focusedCommentId=10127)의 실제 3열 표와 [운영 진행 댓글 v30](https://web-tech-service.atlassian.net/wiki/pages/65817?focusedCommentId=20250739)을 갱신하고 재조회했다. 별도 [지식 본문 v27](https://web-tech-service.atlassian.net/wiki/pages/19464193#한글-서체-교체의-자형과-배포-용량을-함께-검증하기)에 문자 범위·윤곽 보존·성능 지표의 판단 기준과 주의점을 추가하고 본문·원본 근거 링크와 상위 운영 안내 경로를 확인했다. 공통 지침의 로컬·원격 변경은 없다.

## Open Questions

운영 필드 CWV, 실제 전체 페이지·실기기·다른 OS fallback은 미검증이다. 최초 검증은 미커밋 적용본을 기준으로 했다.

사용자가 후속으로 라이선스 고지를 유지한 커밋을 요청했다. 코드 2개·폰트와 OFL 2개·정제 기록 3개·목차의 해당 항목 3개와 검수 해시를 로컬 커밋 범위로 정했다. 공유 목차의 다른 변경과 원시 자료는 제외하고 푸시·배포는 수행하지 않는다. OFL 전문과 폰트 내부 고지를 다시 대조했으며 부분집합의 primary family는 Noto Sans KR, 예약 이름은 Source다.

## Next

기존 현대화 계획의 다음 순서인 Vuln Radar 화면별 JavaScript 분리를 검토한다. 실제 글의 문단·목록·카드 줄바꿈과 실기기 폰트 검증은 별도 후속 범위로 유지한다.
