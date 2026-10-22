# Critical Rendering Path Lab

## Purpose

같은 화면에서 resource 응답과 발견 시점만 바꾸고 Chrome DevTools의 Network·Performance 기록을 비교한다. 정확한 millisecond 값을 재현하는 benchmark가 아니라 event 순서와 LCP 구간을 읽는 실험이다.

## Run

저장소 root에서 실행한다.

```bash
pnpm dev:crp-lab
```

기본 주소는 `http://127.0.0.1:4173`이다. 외부 interface에는 bind하지 않는다.

## Modes

- `/baseline`: 의도적인 지연이 없는 기준 화면
- `/slow-css`: stylesheet response 1.2초 지연
- `/blocking-script`: parser-blocking classic script response 1.2초 지연
- `/late-lcp`: JavaScript가 hero image를 1.2초 뒤에 발견

모든 response는 `Cache-Control: no-store`를 사용한다. 지연된 asset에는 `Server-Timing: injected-delay` header가 포함된다.

## Verify

```bash
pnpm test:crp-lab
pnpm test:crp-lab:browser
```

서버, 테스트, 브라우저 실행 코드는 모두 TypeScript로 관리한다. `pnpm test:crp-lab`은 전용 `tsconfig.json`으로 타입을 먼저 검사한 뒤 테스트를 실행한다. 서버는 Node.js 24의 type stripping으로 실행하며 브라우저용 TypeScript asset도 요청 시 type stripping 후 JavaScript로 응답한다.

`pnpm test:crp-lab:browser`는 Chromium에서 다음 관계를 확인한다.

- render-blocking CSS 응답이 끝난 뒤 FCP가 발생하는가
- parser-blocking script가 실행된 뒤 `DOMContentLoaded`가 발생하는가
- baseline은 HTML의 이미지로 렌더링되고, 늦은 이미지는 같은 navigation에서 `late-lcp-scheduled` → `late-lcp-discovered` → hero 요청 순서를 지키는가
- 기준 페이지의 HTML 응답이 500ms 늦어져도 실제 타이머 대기 240ms를 올바르게 판정하는가
- 테스트에서 타이머 지연을 제거한 변형을 같은 assertion이 거부하는가

테스트는 고정된 FCP·LCP 점수를 성능 예산으로 사용하지 않는다. 실행 환경에 따라 달라지는 절대 시간 대신 resource timing, `Server-Timing`, browser milestone 사이의 순서를 검증한다. 서로 다른 navigation의 `startTime` 차이는 초기 요청·브라우저 처리 비용까지 섞이므로 성공 조건으로 사용하지 않는다. 타이머 대기는 같은 문서의 두 mark로 검사하며 Chromium timestamp 정밀도·타이머 반올림에만 1ms 허용 오차를 둔다. 상한은 강제하지 않으며 재시도나 skip으로 실패를 숨기지 않는다.

늦은 이미지 검사는 성공·실패 시 `late-lcp-timing` JSON을 Playwright 결과에 첨부한다. 로컬 HTML 리포트는 `pnpm --filter docs exec playwright test --config=playwright.crp.config.ts --reporter=html`로 만들 수 있다. 현재 CI는 이 리포트를 원격 artifact로 업로드하지 않으므로 로그만으로 당시 개별 타이밍이나 호스트 부하의 원인을 확정할 수 없다. 조사와 대조군 결과는 [PR #51 검증 보고서](../../verification/performance/2026-10-21-crp-navigation-timing.md)에 기록한다.

브라우저에서는 DevTools의 Network에서 `Disable cache`를 켜고 Performance reload recording을 mode별로 최소 세 번 실행한다.

## Safety

- server는 `127.0.0.1`에만 bind한다.
- 제공할 route와 asset을 allowlist로 제한한다.
- `delay` query는 0~3000ms 범위로 제한한다.
- production에 배포하거나 성능 benchmark 결과로 사용하지 않는다.
