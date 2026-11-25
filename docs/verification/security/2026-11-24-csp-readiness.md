# CSP 자원·보고 경로 조사와 브라우저 검증기의 코드 생성 제거

## 대상과 조건

2026-11-24 KST. 기준34784315의 로컬 후속. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). Node24.22.1·pnpm12.14.0·설치된 Playwright 세 엔진을 사용했다. 앞선 보안 헤더·정제 기록9파일은34784315로 커밋했고 푸시·배포하지 않았다. 기록된 소스 해시와 인덱스 검사를 대조하고 실제 커밋 훅을 통과했다. 기존503검사 보완136ef3c4와 병합 후 미커밋 기록은 보존한다.

## 재현 방법

루트에서 다음 명령을 사용했다.

```sh
pnpm --filter vuln-radar build
pnpm --filter vuln-radar typecheck
pnpm --filter vuln-radar exec eslint src/app/main.tsx src/app/configure-validation.ts --max-warnings 0
pnpm --filter vuln-radar test:lib
```

새 Vite 프로덕션 결과물을 loopback HTTP 서버에서 제공하고 진단용 CSP를 응답에만 주입했다. script-src/style-src/connect-src는 self, object-src/base-uri는 none을 사용했다. 이 정책은 조사용 대조군이며 운영 권장 최종 정책이 아니다. init listener는 effectiveDirective·disposition·inline/eval/자원 분류·앱 번들/문서/기타 출처 분류만 집계한다. 원문 URL·검색어·소스 코드·쿠키·원시 보고는 보관하지 않는다. 고의의 인라인 probe가 Report-Only에서는 실행되고 강제 대조군에서는 막히는지도 확인한다.

API503을 사용하는 baseline 세 엔진×Overview/Feed6조건, 강제 대조군6조건, jitless 적용 후 Overview503·정상 Feed1항목·잘못된 Feed schema의 세 엔진9조건을 구분했다. 반복 attribution 실행은 baseline의 출처 확인이며 새로운 독립 표본으로 합산하지 않는다. 당시 임시 실행기의 정제 결과는 [artifact](../artifacts/2026-11-24-csp-readiness.json)에 둔다.

### 저장소에서 브라우저 이벤트 다시 검증

저장소 루트에서 Node.js 24.22.1, pnpm 12.14.0을 사용한다. 두 커밋이 로컬 Git에 있어야 하며, 의존성과 Playwright 브라우저 바이너리를 먼저 설치한다. 다음 명령은 각 커밋을 임시 폴더에 풀어 현재 작업 트리를 보존한다.

```sh
pnpm install --frozen-lockfile
pnpm --filter docs exec playwright install chromium firefox webkit
csp_repro_dir=$(mktemp -d)
for csp_revision in 34784315 f7a7bd4f; do
  mkdir "$csp_repro_dir/$csp_revision"
  git archive "$csp_revision" | tar -xf - -C "$csp_repro_dir/$csp_revision"
  pnpm --dir "$csp_repro_dir/$csp_revision" install --frozen-lockfile
  pnpm --dir "$csp_repro_dir/$csp_revision" --filter vuln-radar build
done
node scripts/verify-vuln-radar-csp-readiness.mjs \
  "$csp_repro_dir/34784315/apps/vuln-radar/dist" \
  "$csp_repro_dir/f7a7bd4f/apps/vuln-radar/dist"
```

첫 인자는 보안 헤더 기준 빌드, 둘째는 브라우저 진입점에서 jitless를 켠 빌드다. 스크립트가 Playwright에서 같은 출처의 HTML과 자원을 제공하고 HTTP 503, 유효 항목 1개, 스키마가 맞지 않는 JSON을 합성한다. 각 화면의 결과 또는 재시도 버튼, 정책별 인라인 probe 동작, jitless의 앱 번들 eval 0건을 검사한다. 정상 실행은 정제한 브라우저 이벤트를 JSON으로 출력한다. 이 실행기의 범위는 `SecurityPolicyViolationEvent`이며, 아래 보고 전송 수치는 당시 loopback 수집 실험의 기록이다.

2026-11-25 재실행에서 Chromium·Firefox·WebKit의 21개 조건이 통과했다. Report-Only 기준의 두 화면에서 Chromium과 Firefox는 각각 앱 번들 eval 2건, WebKit은 0건이었다. jitless의 9개 조건은 모두 0건이었다.

## 결과와 증거

### 확인한 자원과 제약

| 대상               | 확인 결과                                                                                       | CSP 적용 시 확인할 조건                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| docs layout        | 테마 초기화용 Next Script·Analytics·SpeedInsights                                               | 인라인/동적 로더와 Next 런타임 스크립트의 신뢰 근거 필요                           |
| docs 분석 SDK      | 설치 SDK의 운영 기본 스크립트는 /\_vercel/insights/script.js·/\_vercel/speed-insights/script.js | 기본값과 배포 시 주입/외부 의존성을 구분. unpkg를 운영 허용 목록으로 추가하지 않음 |
| docs 검사 도구     | React Scan·Grab은 development AND 명시적 true에서만 로드                                        | 개발용 unpkg 출처를 운영 필수 의존성으로 오판하지 않음                             |
| docs 본문·코드     | JSON-LD·정제 HTML·Shiki HTML 소비 경로                                                          | 기존 sanitize/이스케이프 유지. 문자열 sink를 무조건 취약점으로 판정하지 않음       |
| docs 이미지·worker | 외부 자산 native fallback과 self-origin push worker                                             | 실제 발행본 이미지·worker 요청을 따로 관측. 기존 오프라인 CSP 유지                 |
| Vuln Radar         | 새 HTML에는 외부 module script1·stylesheet1·인라인 script0                                      | HTML에 인라인이 없어도 의존성의 런타임 코드 생성은 별도 검사                       |
| Vuln Radar API     | /api/backend 상대 경로와 Vercel 서버 proxy                                                      | 브라우저 connect-src에 서버 전용 backend origin을 추가할 근거 없음                 |
| 보고 경로          | 앱 소스에 CSP collector·Reporting-Endpoints/report-to 연결 없음                                 | 수집·정제·요청 제한·실제 HTTPS 전달 검증 후 연결                                   |

### 확인한 코드 생성과 적용

Report-Only baseline에서 Chromium·Firefox의 두 화면은 각각 eval2건을 앱 번들 출처로 보고했고 WebKit은0건이었다. 고의 inline probe는 세 엔진 모두 보고됐다. 설치된 Zod util의 eval 가능성 탐지와 object parser JIT가 Function 생성 경로를 사용함을 실제 소스에서 확인했다. 설치 소스는 jitless일 때 탐지 자체를 생략하며, 공식 문서도 CSP 환경의 jitless 설정을 안내한다.

강제 대조군6조건에서도 화면과503 처리·probe 차단이 유지됐다. 따라서 eval 보고를 앱이 반드시 unsafe-eval을 요구한다는 증거로 해석하지 않는다. 브라우저 진입점의 첫 import에서 z.config({ jitless: true })를 실행해 스키마 초기화보다 먼저 코드 생성을 끄도록 했다. 서버·루트 공통 Zod 설정은 변경하지 않았다.

새 번들9조건에서 앱 번들의 eval 보고는 모두0건이었다. 정상 Feed fixture는 표시되고 잘못된 schema는 오류/재시도 화면으로 처리됐다. 관측기를 검증하는 inline probe만 보고됐고 Report-Only에서 실행은 유지됐다. 타입·변경 소스 lint·기존36검사·프로덕션 빌드가 통과했다. 대용량 파싱 처리량·실서비스 성능 개선은 측정하지 않았다.

### 보고 전달의 별도 판정

최초 report-to+report-uri 단기 HTTP 실험은 유효 보고0·파싱 실패2건으로 전달 검증에 실패했다. 브라우저 이벤트 관측과 혼동하지 않는다. 원문을 저장하지 않아 이2건의 원인을 확정하지 못했다. report-uri만 둔 분리 실행에서는 baseline attribution14건·강제 대조군12건·jitless 후9건의 legacy JSON 보고를 수신했고 파싱 실패0건이었다. probe와 앱 이벤트가 함께 포함된 수이며 독립 사용자 수가 아니다.

현대 batch 보고0건이므로 HTTPS·report-to 전달을 검증했다고 주장하지 않는다. MDN은 Reporting-Endpoints+report-to를 우선하되 호환성이 필요한 경우 report-uri를 함께 두도록 설명한다. 이번 loopback 결과로 deprecated report-uri만 운영 채택하지 않는다. 모든 임시 서버·브라우저는 종료했다.

## 한계와 후속 작업

docs는 현재 소스·설치 문서/SDK 조사이며 새 프로덕션 렌더·발행본 전체 요청 관측은 수행하지 않았다. Vuln Radar의 정상 fixture는1항목이며 대규모 API·Overview 차트 성공·동적 스타일·모바일·운영 실제 자원을 포괄하지 않는다. report-to 배치·실제 운영 보고·수집기 부하/권한·VoiceOver는 미검증이며 VoiceOver는 사용자 요청으로 생략한다.

다음 구현 권장안은 앱별 수집기 입력 계약부터 확정하는 것이다. application/reports+json batch와 application/csp-report legacy를 분리하고 본문/배치 크기·빈도 제한을 둔다. 수집 값은 앱·정책 버전·허용된 directive·disposition·자원 종류·고정 route group 집계로 제한한다. documentURI/blockedURI/sourceFile의 원문·쿼리·코드 sample·쿠키/IP/UA는 저장하지 않으며 입력 URL을 재요청하지 않는다. 위조 가능한 보고는 보안 판정·허용 목록 자동 승격 근거로 쓰지 않는다. 플랫폼 access log와 보고 payload의 보관 경계도 별도로 확인한다.

수집기가 준비된 뒤 HTTPS에서 두 전송 형식과 실제 앱 라우팅을 검증하고 Report-Only를 충분히 관측한다. docs nonce 방식은 정적 렌더링·캐시/PPR 영향을 따로 비교한다. 런타임 HTML에 regex로 nonce를 일괄 주입하거나 모든 문자열을 통과시키는 Trusted Types 정책은 사용하지 않는다. 운영 CSP·새 공개 endpoint·새 의존성·원격 배포는 이번에 적용하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-24-csp-readiness.md)
- [앞선 보안 헤더 검증](2026-11-23-web-security-headers.md)
- [Next CSP](https://nextjs.org/docs/app/guides/content-security-policy)
- [Zod CSP/jitless](https://zod.dev/compile#content-security-policy)
- [MDN 보고 호환성](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/report-to)
