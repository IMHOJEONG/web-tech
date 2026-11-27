# 웹 보안 헤더 1단계와 CSP 사전조사

## 대상과 조건

2026-11-23 KST. 기준 main `b841d21ad76ee64790765315932e06739d60270e`, 후속 브랜치 codex/modern-web-security-headers-20261123의 로컬 변경이다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). Node24.22.1·pnpm12.14.0과 설치된 Playwright Chromium·Firefox·WebKit을 사용했다. Modern Web Guidance CLI1.0.1의 security 전문과 설치된 Next16.4.6 CSP/headers 문서를 조회했다.

## 재현 방법

실제 docs next.config.mjs를 Node 타입 제거 실행으로 import한 뒤 Next의 load-custom-routes를 호출해 headers 경로·키·값을 검증한다. 같은 결과와 vuln-radar vercel.json의 headers 값을 읽어 합성 HTTP 두 출처에 적용했다. 세 엔진 × 두 설정 × 전후의12조건에서 올바른 JavaScript·CSS와 인라인 실행, text/plain 스크립트 실행 여부, 같은 출처/다른 포트의 Referer를 비교한다. 임시 실행기는 저장소 밖에 두고 정제 결과·소스 해시는 artifact에 보존한다.

루트에서 재확인할 정적 검사는 다음과 같다.

```sh
pnpm --filter docs exec eslint next.config.mjs --max-warnings 0
pnpm exec prettier --check apps/docs/next.config.mjs apps/vuln-radar/vercel.json
```

## 결과와 증거

두 앱의 배포 설정에 nosniff·strict-origin-when-cross-origin을 전체 경로로 명시했다. 기존 docs의 offline.html·push-sw.js CSP·캐시 정책은 유지했다. Next의 실제 경로 검증·변경 config ESLint가 통과했다. 초기 검증 실행기는 CommonJS default의 ESM 상호운용을 잘못 읽어 실패했으며 createRequire로 실제 export를 읽어 재실행했다. 제품 코드 오류나 브라우저 실패로 집계하지 않는다.

12조건 모두 통과했다. 올바른 JS·CSS와 인라인 실행은 전후 유지됐고, 잘못된 MIME 스크립트는 전 실행/후 차단됐다. 같은 출처 요청의 합성 경로·검색어는 유지됐고 교차 출처 요청에는 origin만 남았다. 현대 브라우저의 기본 Referrer 동작과 같은 결과이므로 새 성능·개인정보 개선량을 측정했다고 주장하지 않는다. 임시 두 서버와 브라우저는 종료했다. [정제 증거](../artifacts/2026-11-23-web-security-headers.json).

공개 서비스 직접 조회에서 docs3경로는403, vuln-radar의 배포 주소는200 이후 최종 origin이 vercel.com/login으로 달랐다. 그 로그인 페이지의 보안 헤더를 앱 헤더로 판정하지 않았으며 원시 응답·서명 URL·쿠키는 기록하지 않는다. 이는 최초 로컬 검증 시점의 기록이다. 2026-11-24 커밋 요청 시 부모136ef3c4에서 두 설정의 기록 해시가 여전히 일치함을 확인했다. 푸시·배포는 수행하지 않았다.

## CSP 판단과 다음 계획

일반 페이지 CSP를 일괄 강제하지 않았다. docs의 기존 오프라인 CSP와 worker 정책은 특정 응답의 정책이며 일반 페이지 보호와 구분한다. Next nonce 방식은 요청별 렌더링·정적 캐시·PPR에 영향을 주므로 기존 렌더링 경계를 바꾸는 별도 설계가 필요하다. Vite의 정적 HTML은 nonce 복사 대신 빌드별 해시·외부 스크립트·스타일을 조사해야 한다.

다음 순서는 실제 앱의 인라인·외부 자원/동적 HTML 소비 경로 목록 → URL·검색어·코드 표본을 최소화하는 수집기 설계 → Report-Only와 실제 트래픽 관측 → 허용 근거가 확인된 CSP 강제 전환이다. 수집기 없는 Report-Only를 운영 관측 완료로 표시하지 않는다. Trusted Types·COOP/COEP·HSTS 확대·프레이밍 정책은 이번 단계에 추가하지 않았다.

## 한계와 후속 작업

실제 HTTP 헤더의 브라우저 의미는 합성 응답으로 검증했다. Next 프로덕션 재빌드·Vercel 배포 라우팅·기존 전체 앱 회귀·모바일 실기기·운영 수집은 미검증이다. 두 설정의 배포 후 HTML·JS·CSS·JSON·글꼴의 올바른 MIME과 응답 헤더를 다시 확인해야 한다. VoiceOver 후속은 사용자 요청으로 생략한다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-23-web-security-headers.md)
- [기존 현대화 감사](../accessibility/2026-11-21-frontend-modernization-audit.md)
- [MDN nosniff](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)
- [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)
- [Next CSP](https://nextjs.org/docs/app/guides/content-security-policy)
