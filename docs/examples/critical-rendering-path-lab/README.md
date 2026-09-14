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
```

서버, 테스트, 브라우저 실행 코드는 모두 TypeScript로 관리한다. `pnpm test:crp-lab`은 전용 `tsconfig.json`으로 타입을 먼저 검사한 뒤 테스트를 실행한다. 서버는 Node.js 24의 type stripping으로 실행하며 브라우저용 TypeScript asset도 요청 시 type stripping 후 JavaScript로 응답한다.

브라우저에서는 DevTools의 Network에서 `Disable cache`를 켜고 Performance reload recording을 mode별로 최소 세 번 실행한다.

## Safety

- server는 `127.0.0.1`에만 bind한다.
- 제공할 route와 asset을 allowlist로 제한한다.
- `delay` query는 0~3000ms 범위로 제한한다.
- production에 배포하거나 성능 benchmark 결과로 사용하지 않는다.
