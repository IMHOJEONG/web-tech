# CSP HTTPS 전달 복원과 재검증

## 대상과 조건

2026-11-25 KST, 수집기 커밋402e2970과 WebKit 호환 수정 기준. 이전 임시 작업 트리가 디스크에서 사라져 미커밋 소스·검사기를 남아 있는 변경 기록으로 복원하고 새로 실행했다. 이전 raw 결과는 복구하지 못했다. 과거 실행은 [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83) 댓글10127과 [지식 문서](https://web-tech-service.atlassian.net/wiki/pages/19464193#HTTPS-보고-전달의-브라우저-형식과-제한-단위-구분하기) v42에서 별도로 추적한다. 이번 artifact는 새 실행이다.

Node24.22.1·pnpm12.14.0·설치된 Playwright 세 엔진을 사용했다. 브라우저 버전은 artifact에 기록했다. 세 엔진 × docs/Vuln Radar × report-to/report-uri의12조건이다. 실제 Safari 앱 검증과 구분한다.

## 재현 방법

루트 lockfile로 의존성을 준비한 뒤 다음을 실행한다.

```sh
pnpm exec node --experimental-strip-types scripts/verify-csp-https.mjs
pnpm test:repo
pnpm --filter @web-tech/api typecheck
pnpm --filter @web-tech/api lint
```

OpenSSL의 임시 인증서와 loopback HTTPS 서버에서 실제 Next POST·Vercel fetch adapter를 호출한다. report-to 조건에는 legacy fallback을 넣지 않는다. Chromium은 new headless·격리 profile·일회성 SPKI pin·테스트용 short-reporting-delay, Firefox/WebKit은 격리 context의 인증서 오류 무시를 사용한다. 시스템 신뢰 저장소는 변경하지 않는다. 검사기는 합성 보고만 받아16KiB 이내에서 형식 이름을 분류하며 원시 payload를 저장하지 않는다. 제품의 스트림 제한은 별도 핵심 회귀에서 검사한다.

## 결과와 증거

- HTTPS 네이티브 전달12/12조건204. secure context·Report-Only probe 실행·정제 summary 존재를 확인했고 민감 marker 출력은0이었다.
- Chromium/Firefox report-to는 application/reports+json 배열, WebKit report-to는 application/csp-report MIME의 현대식 단일 객체였다. report-uri는 세 엔진 모두 legacy envelope였다.
- WebKit 호환은 csp-report가 없고 type이 정확히 csp-violation·body가 객체인 경우만 허용한다. generic JSON·타입 불일치·null/배열 body·현대 MIME singleton·크기 초과 거절과 기존 정제를 회귀로 확인했다.
- 핵심36개를 포함한 루트375개 통과·실패/생략0, API 타입·lint 통과. 의존성 offline 설치는 캐시 부족으로 실패했고 고정 lockfile 후속 설치는 재사용1418·다운로드0으로 완료했다. 자동 install script는 실행하지 않았다.
- 새 작업 트리의 포맷/린트 캐시 쓰기 차단은 허용된 실행으로 재검사해 해결했다. 기존 원본 checkout은 수정하지 않았다.
- 브라우저·HTTPS 서버 종료, 임시 인증서/키/profile 디렉터리 제거를 확인했다.

[새 정제 artifact](../artifacts/2026-11-25-csp-https-delivery.json)에 최종 소스 해시·브라우저별 관측을 남겼다. 과거 shell에서8초 내 report-to 미관측·수정 전 WebKit400은 원격 이력에서 확인되지만 이번에 과거 상태를 다시 실행한 결과는 아니다.

## 한계와 후속 작업

로컬 브리지는 실제 adapter 호출이며 Next 프로덕션 빌드/trace·Vercel Preview rewrite·공개 CA·플랫폼 ingress/access log·실효 차단·운영 보고는 미검증이다. 가속 타이머는 운영 수신 지연 보장이 아니다. 원격 플랫폼은 이번에 다시 조회하거나 수정하지 않았다. 인스턴스 제한과 리전별 WAF를 정확한 리전 간 전역 예산으로 보고하지 않는다. 헤더 연결·푸시·배포는 실행하지 않았다.

## 관련 문서

- [앞선 수집기 검증](2026-11-24-csp-report-collector.md)
- [실행 runbook](../../runbooks/csp-report-collector.md)
- [작업 기록](../../worklog/2026-11/2026-11-25-csp-https-delivery.md)
- [Playwright 배포판](https://playwright.dev/docs/browsers)
- [Chrome Reporting API](https://developer.chrome.com/docs/capabilities/web-apis/reporting-api)
- [WebKit 전송 구현](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/loader/PingLoader.cpp)
- [Vercel 리전별 제한](https://vercel.com/i/rate-limiting-algorithms)
