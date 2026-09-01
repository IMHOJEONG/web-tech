# Docs Lightweight Remote HTML Sanitizer

## Context

Vercel SSR에서 `postcss` external module load 중 `nanoid@6` ESM/CJS 충돌이 발생했다.

직접 원인은 `postcss@8.5.26`이 `nanoid/non-secure`를 CommonJS `require()`로 불러오는 경로였지만, `docs` 앱 관점의 문제는 remote HTML 처리 경로에서 `sanitize-html`을 런타임 import하면서 `postcss`가 SSR 번들 후보에 들어온 점이다.

## Decision

`sanitize-html` 런타임 의존을 제거하고, 현재 문서 렌더링에 필요한 allowlist 기반 sanitizer를 내부 유틸로 대체한다.

## Changes

- `apps/docs/lib/remote-html-sanitizer.ts`를 추가했다.
- remote HTML sanitize는 허용 tag/attribute allowlist 기반으로 수행한다.
- `script`, `style`, `iframe`, `svg`, `math`, `object`, `embed`, `template` 등 위험 블록은 내용째 제거한다.
- `href`, `src`, `srcset`은 `http`, `https`, `mailto`, `ftp`, relative path, hash anchor만 허용한다.
- `on*` 이벤트 핸들러와 `style` attribute는 허용하지 않는다.
- `target="_blank"` 링크는 `rel="noopener noreferrer"`를 보정한다.
- `content-api-html.ts`와 `normalize-remote-article-html.ts`에서 `sanitize-html` import를 제거했다.
- `apps/docs` 직접 의존성에서 `sanitize-html`, `@types/sanitize-html`을 제거했다.

## Validation

- `CI=true pnpm install --frozen-lockfile`
- `rg -n "from ['\"]postcss|require\\(['\"]postcss|sanitize-html|sanitizeHtml" apps/docs packages`
- `CI=true pnpm --filter docs lint`
- `CI=true pnpm --filter docs typecheck`
- `CI=true pnpm --filter docs test:lib`

검증 결과:

- 앱/패키지 런타임 코드에서 `sanitize-html`, `sanitizeHtml`, 직접 `postcss` import가 남아 있지 않다.
- docs lint, typecheck, lib test가 통과했다.
- lib test는 remote HTML sanitize, TOC 추출, code frame 정규화, callout 정규화, 위험 속성 제거, 안전 링크 `rel` 보정을 포함한다.

참고:

- `CI=true BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false pnpm --filter docs build`는 Next production build 단계에서 3분 이상 추가 출력 없이 진행되어 수동 중단했다.
- 수동 중단 exit code는 `130`이며, 이번 `postcss/nanoid` external module load 에러가 재발한 출력은 없었다.

## Trade-off

이 구현은 범용 HTML sanitizer를 완전히 대체하는 목적이 아니다.
현재 문서 플랫폼에서 허용하는 제한된 HTML contract를 빠르고 예측 가능하게 정리하기 위한 경량 방어선이다.

장기적으로는 remote content sidecar 또는 FastAPI에서 HTML sanitize를 한 번 더 수행하는 이중 방어선을 검토한다.
