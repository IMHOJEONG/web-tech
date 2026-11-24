# ADR-0038: CSP 보고는 제한된 공통 수집기에서 정제한 집계만 남긴다

## 상태와 범위

- 상태: 적용 중
- 대상: docs·Vuln Radar의 로컬 /api/csp-report 구현. main·원격 배포·CSP 헤더 연결 전.
- 결정일: 2026-11-24
- 최종 검토: 2026-11-24
- 추적: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 배경

CSP 위반 보고에는 문서/차단 URL·쿼리·코드 sample·referrer·user_agent가 들어갈 수 있다. 앞선 진단은 브라우저 이벤트와 HTTP 보고 수신이 별개임을 확인했다. 사용자가 jitless 검증을 커밋한 뒤 수집기의 정제·크기·빈도 제한을 구현하도록 요청했다. 수집기는 공개된 위조 가능 입력이므로 인증된 사고 증거나 허용 목록 자동 변경 근거로 취급하지 않는다.

## 결정

기존 @web-tech/api의 독립 server subpath를 공통 구현으로 사용한다. 기존 package 기본 진입점의 모듈 계약은 유지하고 새 소스는 명시적 ESM .mts로 둔다. 두 앱은 같은 /api/csp-report를 노출한다. Next는 Web Request POST route, Vercel은 공식 fetch handler 형식을 사용하며 SPA rewrite가 정확한 수집기 경로를 삼키지 않게 제외한다. 기존 backend proxy와 화면 경로는 유지한다.

application/reports+json batch와 application/csp-report 단일 형식을 구분한다. 로그는 서버에서 정한 앱·schemaVersion과 허용된 directive/disposition·자원 종류·고정 문서 그룹·HTTP 상태군·건수만 가진다. URL 원문/출처 호스트·쿼리·코드·정책 원문·referrer·쿠키·IP·UA는 애플리케이션 출력에서 제외한다. 원시 payload·입력 URL을 보관하거나 재요청하지 않는다. 같은 그룹은 요청 안에서 합치며 최대10개라 저장 키와 로그 크기도 제한된다. schemaVersion은 수집 계약의 버전이며 보고가 실제 배포 정책에서 왔다는 보장은 아니다.

요청 본문16KiB·batch10개·본문 읽기2초·최대16,384회 읽기를 제한한다. Content-Length는 조기 거절에만 쓰고 실제 UTF-8 byte 수를 다시 센다. 압축 입력·잘못된 UTF-8·형식 불일치는 거절한다. 읽기 취소와 deadline/abort listener를 정리하고 원문 오류를 응답·로그에 직렬화하지 않는다.

처리기 인스턴스마다60초 고정 창에60요청을 허용한다. 본문 읽기 전에 동기적으로 예약해 동시 요청도 같은 예산을 쓴다. JSON 오류도 예산을 소비하며 제한 시429/Retry-After를 반환한다. IP별 저장소나 위조 가능한 forwarded header로 새 bucket을 만들지 않는다. 성공은204·본문 없음·no-store이며 거절도 입력을 반사하지 않는다.

## 대안과 영향

앱마다 parser를 복사하면 정제/제한 차이가 생기므로 공통 server subpath를 택했다. 새 외부 패키지는 추가하지 않고 두 workspace dependency 링크만 선언한다. 원문 전체 저장이나 임의 URL/헤더를 로그 키로 쓰는 방식은 제외한다. IP별 제한은 식별정보·신뢰할 proxy 경계가 추가되므로 이번에 도입하지 않는다.

메모리 예산은 인스턴스·cold start·재배포·리전 사이에서 공유되지 않으며 전역 DDoS·과금 방어가 아니다. 운영 활성화 전 플랫폼 전체 빈도/동시성·접근 로그 보관·본문 수신 제한을 확인해야 한다. 앱의 본문 읽기 제한은 플랫폼이 함수 실행 전 수신한 데이터까지 제어하지 않는다. 집계 로그는 동기 출력이며 영속 분석 저장소·실제 정책 위반의 진위를 보장하지 않는다. CSP/Reporting-Endpoints 헤더는 수집기 검증과 별도 단계로 연결한다.

## 관련 문서

- [실행·응답 계약](../runbooks/csp-report-collector.md)
- [정제·경계·실제 HTTP 검증](../verification/security/2026-11-24-csp-report-collector.md)
- [앞선 CSP 준비](../verification/security/2026-11-24-csp-readiness.md)
- [Vercel Web Handler](https://vercel.com/docs/functions)
- [MDN 보고 형식](https://developer.mozilla.org/en-US/docs/Web/API/CSPViolationReport)
