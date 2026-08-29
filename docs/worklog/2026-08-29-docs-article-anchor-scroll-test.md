# Docs Article Anchor Scroll Test

## 배경

`docs` article detail은 sticky header와 desktop TOC를 함께 사용한다.

TOC 항목을 클릭했을 때 heading이 화면 상단으로 이동하는데, `scroll-margin-top` 또는 header offset 기준이 깨지면 제목이 sticky header 아래에 가려질 수 있다.

이번 작업은 responsive automation 후보 중 `article anchor visibility assertion`을 실제 Playwright smoke test로 추가한 것이다.

## 적용 내용

- Playwright project에 `chromium-desktop`을 추가했다.
- `/docs/web/javascript-event-loop-runtime`에서 desktop TOC 항목을 클릭하는 테스트를 추가했다.
- 테스트는 `prefers-reduced-motion: reduce`를 emulation해서 smooth scroll 대기 시간을 줄인다.
- TOC의 `실무 체크리스트` 항목 클릭 후 target heading의 top 좌표가 sticky header bottom보다 아래에 있는지 확인한다.

## 테스트 기준

검사 route:

```text
/docs/web/javascript-event-loop-runtime
```

검사 조건:

- desktop viewport에서 TOC 링크가 보여야 한다.
- TOC 클릭 후 target heading이 sticky header 아래 최소 `8px` 여유를 두고 보여야 한다.
- heading은 viewport 내부의 의미 있는 상단 영역에 위치해야 한다.

## React Scan 확인

E2E 실행 중 아래 개발용 경고가 반복적으로 보였다.

```text
[React Scan] react-grab v0.1.32 is outdated ...
```

공식 npm package 기준 `react-scan`의 latest dist-tag는 `0.5.7`이다.

경고에 직접 등장하는 `react-grab`의 latest dist-tag는 `0.2.0`이다.

다만 GitHub issue에 `react-scan@0.5.x`가 일부 하위 dependency를 `latest`로 참조해 install 시점에 transitive dependency tree가 달라질 수 있다는 재현성 이슈가 열려 있다. 따라서 지금은 즉시 업그레이드보다 아래 순서가 안전하다.

1. 개발 환경에서만 로드되는지 유지한다.
2. lockfile과 pnpm supply-chain policy가 통과하는지 확인한다.
3. 필요 시 CDN URL을 버전 고정 형태로 바꾼다.
4. 별도 작업으로 `react-scan` 로딩 자체가 E2E 로그를 오염시키지 않게 dev-only/debug flag를 더 명확히 분리한다.

## React Inspection Tools 정책 고정

우선순위는 `production bundle/runtime에 싣지 않는다`로 고정했다.

적용 내용:

- `react-scan`과 `react-grab` script URL을 `apps/docs/shared/config/react-inspection-tools.ts`로 분리했다.
- `shouldLoadReactInspectionTools()`는 `NODE_ENV === "development"`일 때만 `true`를 반환한다.
- `production`, `test`, `undefined` 환경에서는 항상 로드하지 않도록 unit test를 추가했다.

이 정책을 먼저 고정한 이유:

- 두 도구는 사용자 기능이 아니라 개발 진단 도구다.
- production에 포함되면 불필요한 외부 CDN 의존성과 runtime noise가 생긴다.
- `react-scan@0.5.x`의 transitive dependency 재현성 이슈가 정리되기 전까지는 production 영향권 밖에 두는 편이 안전하다.

아직 하지 않은 일:

- CDN URL 버전 고정은 별도 작업으로 남긴다.
- E2E 전용 disable flag는 필요성이 더 커지면 추가한다.

## 검증

```bash
CI=true pnpm --filter docs lint
CI=true pnpm --filter docs typecheck
CI=true pnpm --filter docs test:e2e
```
