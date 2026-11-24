# CSP 보고 수집기 실행과 활성화 전 점검

## 목적과 준비 조건

대상은 docs·Vuln Radar /api/csp-report의 로컬 구현이다. Node24·루트 pnpm workspace 의존성이 필요하다. 실제 비밀·사용자 URL·운영 보고 원문을 테스트 입력에 넣지 않는다. 결정은 [ADR-0038](../architecture/adr-0038-csp-report-collector.md), 실행 결과는 [검증 보고서](../verification/security/2026-11-24-csp-report-collector.md)가 원본이다.

## 실행 순서

1. 루트에서 pnpm의 고정 lockfile을 설치한다. 공통 @web-tech/api/csp-reporting은 서버 전용 subpath다. 외부 패키지 버전은 바꾸지 않고 두 앱의 workspace 링크를 사용한다.
2. 다음 검사로 정제·byte/배치/읽기/빈도 경계를 확인한다.

```sh
pnpm exec node --experimental-strip-types --test scripts/csp-reporting.test.mjs
pnpm --filter @web-tech/api typecheck
pnpm --filter docs typecheck
pnpm --filter vuln-radar typecheck
pnpm test:repo
```

3. 실제 Next 서버의 /api/csp-report와 Vercel Web Handler를 통해 같은 정상·잘못된 입력을 확인한다. Vercel SPA rewrite의 경로 제외는 로컬 regex 검사와 실제 Preview 라우팅을 구분한다. 보고 endpoint가 HTML 화면으로 응답하면 활성화하지 않는다.
4. 허용 media type은 application/reports+json의1~10개 배열 또는 application/csp-report의 csp-report object다. 다른 reporting type·알 수 없는 directive/disposition·유효하지 않은 항목은 집계에서 제외한다. 빈/잘못된 envelope는400, 정상 envelope의 무관한 항목만 있는 경우204·로그 없음이다. legacy disposition 누락은 unknown으로 집계한다.
5. 로그가 고정 그룹과 건수만 포함하는지 합성 sentinel로 확인한다. schemaVersion1·서버 지정 app은 원문 report의 app/version 주장을 신뢰하지 않는다. directive는 코드에 나열된 CSP source 지시문·Trusted Types 지시문만 받는다. 문서는 article/index/feed/overview/other/external/unknown, status는1xx~5xx/unknown이다. resource는 inline/eval/wasm-eval/trusted-types/network/data/blob/extension/other다. 새 종류는 실제 근거와 검증 후 코드에서 추가한다.
6. 운영 전 플랫폼의 전역 빈도·동시성·body ingress 제한과 access log의 IP/UA/query 보관을 따로 확인한다. 공개 report는 위조 가능하므로 집계가 권한·정책 변경을 실행해서는 안 된다.
7. 배포 승인 후 HTTPS Preview에서 현대 batch·legacy 실제 브라우저 전달과 두 앱의 라우팅을 재확인한다. 그 뒤 Reporting-Endpoints+report-to와 필요한 legacy fallback을 연결하고 Report-Only를 충분히 관측한다. 이번 구현은 해당 헤더를 켜지 않는다. 원문 sample을 수집하도록 report-sample을 추가할 때도 별도 개인정보 검토가 필요하다.

## 기대 결과

| 조건                                                      | 응답                 | 로그                                                       |
| --------------------------------------------------------- | -------------------- | ---------------------------------------------------------- |
| 정상 보고 또는 무관한 항목만 있는 정상 envelope           | 204·빈 본문·no-store | 정제 그룹이 있을 때만 동기 summary1개                      |
| POST 이외                                                 | 405·Allow: POST      | 없음. Next의 미정의 HTTP method 응답은 framework 기본 처리 |
| media type/압축 불일치                                    | 415                  | 없음                                                       |
| JSON·UTF-8·envelope·Content-Length 문법 오류              | 400                  | 원문/오류 객체 없음                                        |
| 실제/선언 byte16KiB 초과·batch10개 초과·읽기16,384회 초과 | 413                  | 없음                                                       |
| 읽기2초 초과 또는 request abort                           | 408                  | 없음                                                       |
| 인스턴스의60초/60요청 예산 소진                           | 429·Retry-After      | 없음                                                       |
| 정제 로그 sink의 동기 실패                                | 503·빈 본문          | 예외 원문 없음                                             |

동일 그룹의 보고는 한 요청 안에서 count로 합친다. 저장되는 사용자별 bucket은 없으며 빈도 예산은 body 읽기 전에 예약한다. 전체16KiB 경계는 Content-Length나 문자열 길이가 아니라 실제 bytes로 판정한다. 빈 chunk도 읽기 예산을 쓰므로 byte 수를 늘리지 않는 반복이 무한 대기가 되지 않는다.

## 실패 대응과 복구

- 파싱 실패: 원문을 콘솔에 출력하지 말고 media type·입력 크기·합성 재현으로 분리한다. 민감값이나 응답 body를 오류 메시지에 넣지 않는다.
- 429: Retry-After와 인스턴스 단위 제한임을 확인한다. forwarded IP마다 bucket을 만들어 회피하거나 즉시 제한을 무제한으로 올리지 않는다.
- 수신 없음: 브라우저 이벤트·실제 HTTP 수신·현대 batch 전달·배포 라우팅을 나눠 본다. 운영 수신 성공을 합성 POST만으로 판정하지 않는다.
- 503: 정제 summary sink를 확인한다. 원본 report나 예외를 추가로 로그에 넣어 디버깅하지 않는다.
- 활성화 후 문제: Reporting-Endpoints/Report-Only 연결을 되돌리는 것과 CSP enforcement를 되돌리는 것은 다르다. 기존 오프라인 CSP·backend proxy를 무관하게 끄지 않는다.

## 관련 검증

- [11-24 수집기 검증](../verification/security/2026-11-24-csp-report-collector.md)
- [11-24 코드 생성·보고 준비](../verification/security/2026-11-24-csp-readiness.md)
