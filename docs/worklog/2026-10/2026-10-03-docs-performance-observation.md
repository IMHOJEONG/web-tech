# Docs 성능·요청 계측

## Summary

실사용자 성능과 서버 작업 시간을 분리해 확인할 기반을 추가했다. 기존 렌더링·원격 우선·캐시 정책은 유지한다.

## Changed

- docs 앱에만 Speed Insights 2.0.0 설치. URL 정제, lab/API 제외와 browser debug 비활성화.
- Proxy 발급 요청 ID와 상세·검색 operation 로그 연결. 서버 오류 hook은 원문 대신 route 템플릿만 별도 기록.
- 상세 로더와 원격 대기 계측을 추가하고 sitemap에는 요청 헤더 의존성을 추가하지 않았다.
- 한·영 개인정보 안내와 [측정 절차](../../runbooks/docs-deployed-performance-measurement.md), [기존 로그 정책](../../architecture/docs-request-lifecycle-logging-policy.md)을 갱신했다.

## Notes

- Node 24의 계측·정제 단위 테스트 6개, 앱 타입 검사와 변경 코드 ESLint를 통과했다.
- 전체 라이브러리 검사 `mise exec -- pnpm --filter docs test:lib`는 Node 테스트 타입 검사와 201개 테스트를 통과했다. 최초 실행은 sandbox 쓰기 제한으로 중단되어 권한 승인 후 재실행했다.
- 로컬 fixture production 빌드 및 모바일 상세/요청 ID 회귀 9개 통과. 실제 수신한 서로 다른 UUID와 외부 ID 덮어쓰기를 확인했다.
- 배포·Vercel Dashboard 활성화·실제 사용자 지표 수집과 서버 오류 hook의 배포 동작은 미검증이다. 기존 별도 복구 정책 변경은 보존했다.

## Open Questions

Preview에서 응답 ID와 오류 hook의 실제 상관관계, 캐시 이후 요청별 헤더, 종료·취소 관측 범위와 수집 비용은 미검증이다.

## Next

배포 후 Speed Insights 할당량 확인·활성화 및 모바일 표본 확보. 단계별 지표와 사용자 p75를 대조하고 이후 최적화를 결정한다.
