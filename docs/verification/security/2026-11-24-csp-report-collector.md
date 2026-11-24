# CSP 보고 수집기 정제·크기·빈도 경계 검증

## 대상과 조건

2026-11-24 KST. 기준 f7a7bd4f의 로컬 수집기 후속이다. 앞선 jitless·정제 기록9파일은 사용자 요청대로 f7a7bd4f에 커밋했으며 푸시하지 않았다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). Node24.22.1·pnpm12.14.0·Next16.4.6·Playwright 세 엔진을 사용했다. 새 외부 의존성은 없으며 두 앱의 기존 workspace API 링크만 추가했다.

## 재현 방법

[runbook](../../runbooks/csp-report-collector.md)의 root/package 검사를 실행한다. 핵심 회귀는 scripts/csp-reporting.test.mjs이며 pnpm test:repo에 자동 포함된다. 허용 필드·그룹 분류·민감 sentinel 제외·modern/legacy 형식·UTF-8 경계·압축/헤더 거절·chunk/빈 chunk/시간/abort·동시 예산·sink 실패·실제 두 adapter와 SPA 경로를 검사한다.

별도 loopback 실행에서는 실제 Next dev API와 실제 Vercel fetch adapter를 HTTP 브리지로 제공했다. 각 정상/불량 입력6개, 세 브라우저×두 앱의 실제 legacy 보고6개, 두 앱의 동시65요청2조건을 확인했다. 브라우저는 보고용 합성 HTML을 사용해 native report-uri 전송을 발생시킨다. modern batch는 합성 HTTP POST로 확인하며 실제 HTTPS Reporting API 전송과 구분한다. 원시 보고·헤더·URL/코드 표본은 보관하지 않고 합성 sentinel이 애플리케이션 로그에 없는지 확인한다.

## 결과와 증거

- 핵심 수집기34개·최종 루트373개 모두 통과, 실패·생략0개. 처음 루트 실행의 기존 body-parser socket2개 EPERM은 허용된 접속 환경에서 동일 검사를 재실행해 통과했다. 이후 경로 분류·빈 chunk 경계를 추가한 최종 suite가373개다.
- API/docs/vuln-radar 타입 검사와 변경 소스 lint가 통과했다. 새 server 진입점을 .mts로 명시해 기존 API 기본 모듈 계약과 분리했다.
- 실제 HTTP20조건 모두 통과했다. legacy·modern204, JSON400·본문/배치413·media415·no-store/빈 응답을 확인했다. 세 브라우저 모두 보고를 전달하고 Report-Only probe 실행을 유지했다.
- 최종 HTTP 동시65요청은 두 앱 각각52개204·13개429였다. 앞선 정상/불량 입력과 브라우저 보고가 같은 창의 예산을 소비한 결과다. 단위 회귀는 새 인스턴스에서 정확히60허용·5거절, 창 경계 복귀·Retry-After를 확인했다. forwarded IP나 Origin 변경으로 새 bucket이 생기지 않는다.
- byte16KiB 정확한 경계, Content-Length 축소/초과, 한글 UTF-8,10/11개 batch, chunk 누적·잘못된 UTF-8·무한 빈 조각·시간/abort와 취소를 검증했다. JSON 오류도 빈도 예산을 쓰고 알 수 없는 항목은 정제 출력에서 제외됐다.
- 원문 URL·검색어·코드 sample·정책·referrer·쿠키/UA/임의 필드를 넣은 합성 입력에서도 정해진 그룹과 count만 출력됐다. 실제 HTTP 두 애플리케이션 로그에 sentinel이 없었고 응답도 비어 있었다.
- 최초 HTTP 브리지는 취소 후 controller를 다시 close해 실패했다. 검사 브리지를 수정한 뒤20조건을 재실행했다. 이를 제품 수집기 결함이나 완료 증거로 섞지 않는다.

[정제 artifact](../artifacts/2026-11-24-csp-report-collector.json)에 최종 소스 해시·한계·상태별 건수를 기록했다. lockfile diff는 workspace 링크6행뿐이며 외부 package version 변화가 없다. 최초 offline store cache 실패·후속 다운로드0 동기화와 worktree prepare 경고는 [worklog](../../worklog/2026-11/2026-11-24-csp-report-collector.md)에 분리했다.

## 한계와 후속 작업

증거는 로컬 Next 개발 HTTP와 Vercel Web Handler 브리지이며 실제 Vercel 배포 라우팅·Next 프로덕션 빌드/trace·HTTPS modern batch 브라우저 전달은 미검증이다. 경로 regex 검사만으로 원격 rewrite 성공을 주장하지 않는다. Next의 개발 loopback URL 정규화로 문서 origin 분류가 external이 될 수 있으며 원문 로그를 추가해 보정하지 않는다.

빈도 제한은 처리기 인스턴스 메모리의 고정 창이다. cold start·재배포·리전 간 공유되지 않으며 전역 DDoS/과금 방어가 아니다. 플랫폼 ingress body·전역 빈도/동시성·access log 보관과 sink의 영속성은 배포 전 별도 확인해야 한다. report는 위조 가능하며 실제 공격·사용자 수·정책의 신뢰 근거로 자동 승격하지 않는다. IP/쿠키/UA별 상태는 만들지 않는다.

새 공개 endpoint는 로컬 구현일 뿐 미커밋·미푸시·미배포다. CSP·Reporting-Endpoints·Report-Only 헤더를 앱에 연결하지 않았다. 수집기 경계가 검증된 뒤 HTTPS Preview와 플랫폼 제한을 확인하고 Report-Only 관측으로 이어간다. VoiceOver 후속은 사용자 요청으로 생략한다. 임시 Next 서버는 cwd/PID 확인 후 SIGTERM으로 종료했고3217 LISTEN 없음을 재조회했다. HTTP 브리지·probe 서버와 브라우저도 종료했다.

## 관련 문서

- [ADR-0038](../../architecture/adr-0038-csp-report-collector.md)
- [운영·응답 계약](../../runbooks/csp-report-collector.md)
- [이번 작업 기록](../../worklog/2026-11/2026-11-24-csp-report-collector.md)
- [앞선 CSP 준비](2026-11-24-csp-readiness.md)
- [MDN 보고 형식](https://developer.mozilla.org/en-US/docs/Web/API/CSPViolationReport)
- [Vercel 함수](https://vercel.com/docs/functions)
