# 배포 상세 페이지 성능 측정

## 목적과 준비 조건

공개 상세 페이지의 브라우저 로딩을 읽기 전용으로 측정한다. Node.js 24, 설치된 워크스페이스 의존성과 Playwright Chromium이 필요하다. 아래 과거 기준선은 현재 배포의 성능을 보장하지 않는다.

## 기대 결과

실행이 끝나면 JSON에 Navigation Timing·LCP·CLS·본문 hash가 기록된다. 표본 조건이 다른 결과를 직접적인 성능 개선으로 해석하지 않는다.

### 2026-09-18 기준선

대상: `https://heap-forge.app`. Chromium 151.0.7922.34로 두 상세 페이지를
데스크톱/모바일 조건에서 각각 3회, 총 12회 측정했다. 운영 데이터 변경,
웹훅 호출, 캐시 초기화, 재배포는 하지 않았다.

원본 증거: `docs/verification/artifacts/2026-09-18-deployed-performance.json`.
측정 종료: 2026-09-18 02:51:52 UTC / 11:51:52 KST.

| 페이지 / 조건                              | TTFB 중앙값 (범위)   | LCP 중앙값 (범위)    | 본문 컨테이너 표시 관측 중앙값 |
| ------------------------------------------ | -------------------- | -------------------- | ------------------------------ |
| javascript-event-loop-runtime / desktop    | 1.218s (0.670–3.585) | 1.908s (1.172–4.308) | 1.904s                         |
| web/browser / desktop                      | 0.725s (0.720–0.888) | 1.232s (1.220–1.400) | 1.228s                         |
| javascript-event-loop-runtime / mobile-lab | 0.738s (0.630–0.831) | 4.076s (3.400–4.204) | 4.123s                         |
| web/browser / mobile-lab                   | 0.647s (0.634–0.820) | 3.340s (3.224–3.740) | 3.327s                         |

- 모두 HTTP 200. 관측 구간에서 pageerror, HTTP 4xx/5xx, 로드 완료 후 깨진 이미지 없음.
- 이벤트 루프 desktop 1/2회에서 CLS 약 1.00048, 3회에서는 0.00048.
  browser desktop은 모두 약 0.00048, 모바일은 모두 0. 아직 이동 원인은 확정하지 않았다.
- desktop LCP 요소는 이벤트 루프 글의 P, browser 글의 H1이었다.
  모바일은 두 페이지 모두 P였다. 이번 두 화면의 LCP는 이미지가 아니다.
- 모바일 HTML 응답 완료(responseEnd)는 약 0.762–0.972초인데 LCP는 3.224–4.204초였다.
  전달 이후 리소스 로드/스타일/폰트/메인 스레드 작업의 추적이 필요하다.
  이 측정만으로 특정 폰트나 hydration을 원인으로 확정할 수는 없다.

## 측정 조건과 해석 한계

- desktop: 1280×800, 추가 네트워크/CPU 제한 없음.
- mobile-lab: 390×844, mobile/touch 모드, 추가 latency 150ms,
  download 200000 bytes/s(1.6Mbps), upload 93750 bytes/s(0.75Mbps), CPU 4배 제한.
- 매회 새 browser context 사용. CDN/function 캐시는 통제하지 않았다.
  첫 실행을 서버 cold start라고 단정하지 않는다.
- DOMContentLoaded 이후 `.mdx-wrapper`의 visible 상태를 기다린 뒤 load 및 5초 관측.
  본문 표시 시간에는 자동화 도구 지연이 포함되며 전체 코드 하이라이팅 완료 시간이 아니다.
- LCP는 관측 종료까지의 후보값이다. 3회 중앙값은 실제 사용자 p75/CrUX가 아니다.
- 모바일은 실물 기기가 아닌 Chromium 에뮬레이션이며 기본 UA를 사용한다.
- 응답의 Vercel 경로는 `sfo1::iad1`이었다. 한국 실사용자 지역 측정으로 해석하지 않는다.
- 초기 탐색 측정은 로컬 글에 없는 `<article>`을 기다리는 측정기 오류가 있었다.
  `.mdx-wrapper`로 수정하고 전부 재측정했다. 원본 JSON과 위 표에는 재측정만 포함했다.

[LCP 기준](https://web.dev/articles/lcp)은 2.5초 이하가 양호, 4초 초과가 느린 범위지만,
서비스 판정은 실사용자 p75로 해야 한다. [실험실/현장 데이터 차이](https://web.dev/articles/lab-and-field-data-differences)도 참고한다.

## 상세 서버 렌더링 시간: 아직 분리 측정 안 됨

TTFB는 DNS/TLS/네트워크/CDN/서버 응답 준비를 포함하므로 React 렌더링 시간과 같지 않다.
[TTFB 정의](https://web.dev/articles/ttfb)를 따른다.

`Server-Timing`에는 Cloudflare의 `cfEdge`, `cfOrigin`만 있었다.
cfOrigin은 165–2949ms였지만 애플리케이션 렌더링 CPU 시간이 아니다.
원격 fetch, 캐시 조회, Markdown 변환, React 렌더링 각각의 시간은 이번 공개 측정으로 알 수 없다.

다음 배포에서는 request/trace ID에 연결한 서버 span으로 데이터 조회, 본문 변환,
메타데이터 처리를 각각 기록하고 Vercel 요청 기간과 대조해야 한다.
비동기 데이터 함수의 실행 시간만 측정해서 이를 React 전체 렌더링 시간으로 표시하지 않는다.
토큰, 요청 인증 헤더, 원문 전체는 로그에 기록하지 않는다.

## 캐시 신선도: 관측과 검증 구분

12회 응답 모두 `x-vercel-cache: MISS`, `cf-cache-status: DYNAMIC`, `age: 0`,
`cache-control: private, no-cache, no-store, max-age=0, must-revalidate`였다.
이는 HTML 응답 캐시 관측이다. Next Data Cache까지 MISS라는 뜻은 아니다.
각 문서의 본문 텍스트 SHA-256은 6회 모두 같았다. 일관성은 확인했지만 원본 최신성은 증명하지 못한다.
공개 URL만으로 실제 local/remote 선택도 단정하지 않는다. Runtime Logs의 선택 결과와 대조해야 한다.

현재 소스는 remote fetch에 revalidate/tag를 지정하며 기본 TTL은 300초다.
배포 환경 변수 값은 조회하지 않았다. TTL이 지났다는 사실만으로 300초 안에 모든 화면이
최신화된다고 보장하면 안 된다. 요청 발생, 재검증 완료, upstream 성공 여부가 영향을 준다.

승인된 테스트 문서로 다음을 별도 수행한다.

1. 원문 V1과 프론트 V1을 확인하고 UTC 시각과 공개 버전 마커를 기록한다.
2. NAS 원문을 V2로 변경하고 인증된 backend API에서 V2 확인 시각을 기록한다.
3. 웹훅 없이 새 HTTP 요청을 제한된 간격(예: 15초)으로 보내 TTL 경로의 첫 V2 시각을 확인한다.
4. V3으로 변경하고 backend V3 확인 후 인증된 revalidation webhook을 호출한다.
5. 새로운 상세 HTTP 요청에서 V3 및 목록 메타데이터가 모두 반영되는지 확인한다.
6. `첫 프론트 Vn 관측 시각 - backend Vn 확인 시각`을 반영 지연으로 기록한다.
   polling 간격만큼 오차가 있음을 명시하고 열린 탭의 Router Cache는 별도 시험한다.

운영 콘텐츠 수정/전역 태그 만료를 동반하므로 이번에는 실행하지 않았다.
실행 시 별도 테스트 글과 최대 관측 시간, 원복 계획을 먼저 정한다.

## 실행 순서

저장소 루트에서 Node/mise 및 workspace 의존성과 Playwright Chromium이 준비되어 있어야 한다.

```sh
mise exec -- node --check apps/docs/scripts/measure-deployed-performance.mjs
PERF_OUTPUT=/tmp/heap-forge-performance.json mise exec -- node apps/docs/scripts/measure-deployed-performance.mjs
```

특정 문서만 측정하려면:

```sh
PERF_OUTPUT=/tmp/browser-performance.json mise exec -- node apps/docs/scripts/measure-deployed-performance.mjs /ko/docs/web/browser
```

출력에는 public 캐시 헤더, Navigation Timing, LCP 요소, CLS, 본문 hash가 포함된다.
인증 헤더와 쿠키는 수집하지 않는다. 기본 실행은 12회 페이지 이동과 하위 리소스 요청을 만든다.
스크립트의 폴더명/태그에 의존하는 selector는 UI 변경 시 함께 갱신한다.

## 실패 대응과 복구

접속 실패나 본문 selector timeout이면 대상 URL·배포 상태·현재 DOM을 확인하고 종료 코드를 기록한다. 측정 실패를 정상 0ms로 치환하지 않는다. 운영 콘텐츠나 캐시를 변경하지 않으므로 이 읽기 전용 측정에는 콘텐츠 원복이 필요하지 않다.

### 후속 우선순위

1. desktop CLS 1.0 사례를 DevTools Performance trace/스크린샷으로 재현하고 이동 요소 확인.
2. 모바일 텍스트 LCP의 폰트/CSS/메인 스레드 waterfall 확인. 이미지 preload부터 추가하지 않는다.
3. 서버 span을 배포한 후 요청 ID 기반으로 상세 렌더링 비용 분해.
4. 테스트 문서의 TTL/웹훅 신선도 실험 및 실사용자 LCP p75 수집.

## 관련 검증

- [2026-09-18 기준선 보고서](../verification/performance/2026-09-18-deployed-performance-measurement.md)
- [레이아웃 이동과 텍스트 지연 진단](../verification/performance/2026-09-18-docs-layout-shift-text-lcp-diagnosis.md)
