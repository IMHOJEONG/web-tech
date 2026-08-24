# Docs Local MDX Shiki Timeout Analysis

## Purpose

이 문서는 `/docs/web/javascript-event-loop-runtime` 상세 페이지에서 발생한 Vercel runtime timeout 원인과 검증 증거를 정리한다.

핵심 결론:

- 원격 content API 장애가 직접 원인이 아니었다.
- 로컬 MDX 상세 렌더링 중 Shiki syntax highlighter 초기화 비용이 Vercel server runtime 제한에 걸린 것이 원인이었다.
- 로컬 문서 상세에서 Shiki를 건너뛰도록 바꾼 뒤 로컬 production과 배포 URL 모두 정상 응답을 확인했다.

## Symptom

배포 URL:

```txt
https://heap-forge.app/docs/web/javascript-event-loop-runtime
```

초기 증상:

```txt
2026-08-23 08:12:35.813 [error] Vercel Runtime Timeout Error: Task timed out after 10 seconds
```

브라우저 또는 `curl` 요청에서는 Cloudflare 앞단에서 `504`가 관찰됐다.

## Why Vercel Timeout Matters

이 페이지는 정적 HTML 파일을 그대로 서빙하는 구조가 아니다.

`/docs/[...slugParts]`는 요청 시점에 Next.js server runtime에서 아래 작업을 수행한다.

```txt
request
→ route params 해석
→ 로컬 문서 탐색
→ MDX evaluate
→ remark / rehype plugins 실행
→ React Server Component 렌더링
→ response
```

Vercel 로그에 `Task timed out after 10 seconds`가 남았다는 것은, 해당 배포 환경의 server runtime이 요청 처리에 허용한 시간 안에 응답을 끝내지 못했다는 뜻이다.

따라서 로컬 문서 파일을 빠르게 찾더라도, 그 뒤의 MDX 변환과 서버 렌더링이 오래 걸리면 페이지 전체가 timeout될 수 있다.

## Why Shiki Was Suspicious

Shiki는 단순히 CSS class를 붙이는 가벼운 highlighter가 아니다.

Shiki는 VS Code 계열 grammar와 theme 기반으로 tokenization을 수행한다. 서버에서 처음 실행될 때 grammar, theme, tokenizer 초기화 비용이 발생할 수 있다.

문제 당시 일반 문서 상세 경로는 `renderArticleContent()`를 호출하면서 `codeHighlight` 기본값을 사용했다.

관련 코드:

```txt
apps/docs/app/docs/[...slugParts]/page.tsx
```

수정 전에는 일반 `/docs/...` 상세에서 Shiki가 켜진 채 MDX evaluate가 실행될 수 있었다.

반면 카테고리 상세:

```txt
apps/docs/app/category/[main]/[sub]/[slug]/page.tsx
```

이 경로에는 이미 `codeHighlight: false`가 적용되어 있어 같은 timeout이 재현되지 않았다.

## Evidence

### 1. 문제 상세 URL만 지연됐다

실행 명령:

```bash
/usr/bin/curl -s -o /tmp/heap-forge-doc.html \
  -w 'status=%{http_code} total=%{time_total}s starttransfer=%{time_starttransfer}s size=%{size_download}\n' \
  https://heap-forge.app/docs/web/javascript-event-loop-runtime
```

수정 전 관찰값:

```txt
status=504 total=11.126806s starttransfer=11.124325s size=16
```

동시에 `/feed`, `/docs`는 응답했다.

실행 명령:

```bash
DOCS_PROD_CHECK_BASE_URL=https://heap-forge.app \
  pnpm --filter docs check:prod-routes \
  /docs/web/javascript-event-loop-runtime /feed /docs
```

수정 전 관찰값:

```txt
FAIL /docs/web/javascript-event-loop-runtime status=ERR total=10006ms bytes=0 error=AbortError limit=5000ms
PASS /feed status=200 total=921ms bytes=84455
PASS /docs status=200 total=2012ms bytes=107948
```

해석:

- 사이트 전체가 죽은 것이 아니다.
- 목록 라우트도 죽은 것이 아니다.
- 특정 로컬 상세 렌더링 경로가 timeout에 걸렸다.

### 2. 원격 content API는 느린 timeout이 아니었다

실행 명령:

```bash
/usr/bin/curl -s -o /tmp/heap-forge-api.txt \
  -w 'api status=%{http_code} total=%{time_total}s size=%{size_download}\n' \
  https://api.heap-forge.app/api/posts
```

관찰값:

```txt
api status=530 total=0.485475s size=17
```

해석:

- 원격 API는 실패하고 있었지만 오래 붙잡히는 실패가 아니었다.
- 문제 상세 URL의 `11s` 지연과 직접적인 시간 상관이 낮다.
- 따라서 원격 API보다 상세 렌더링 비용을 먼저 봐야 했다.

### 3. 로컬 production에서 Shiki를 끄자 상세 응답이 빠르게 내려왔다

수정:

```ts
const renderedArticle = await renderArticleContent(target, {
  codeHighlight: target.contentSource !== "local",
  components,
});
```

의미:

- 로컬 문서 상세는 `codeHighlight: false`
- 원격 MDX 문서는 기존 동작 유지
- 원격 HTML 문서는 기존 HTML 정규화 경로 유지

로컬 검증 명령:

```bash
CI=true pnpm --filter docs build
cd apps/docs
./node_modules/.bin/next start --port 3003
DOCS_PROD_CHECK_BASE_URL=http://localhost:3003 pnpm --filter docs check:prod-routes
```

로컬 production 관찰값:

```txt
PASS /docs/web/javascript-event-loop-runtime status=200 total=81ms bytes=73599
PASS /category/fe/react/server-client-component-boundary status=200 total=78ms bytes=93629
```

해석:

- 같은 production build 조건에서 상세 URL이 10초가 아니라 100ms 이하로 내려왔다.
- Shiki 초기화 경로를 제거한 것이 직접적인 효과를 냈다.

### 4. 배포 후 실제 URL도 회복됐다

실행 명령:

```bash
/usr/bin/curl -s -o /tmp/heap-forge-doc-current.html \
  -w 'deployed status=%{http_code} total=%{time_total}s starttransfer=%{time_starttransfer}s size=%{size_download}\n' \
  https://heap-forge.app/docs/web/javascript-event-loop-runtime
```

배포 후 관찰값:

```txt
deployed status=200 total=0.975858s starttransfer=0.886691s size=73596
```

추가 배포 URL route check:

```bash
DOCS_PROD_CHECK_BASE_URL=https://heap-forge.app \
  pnpm --filter docs check:prod-routes \
  /docs/web/javascript-event-loop-runtime /feed /docs
```

관찰값:

```txt
PASS /docs/web/javascript-event-loop-runtime status=200 total=929ms bytes=73955
PASS /feed status=200 total=405ms bytes=84455
PASS /docs status=200 total=601ms bytes=107948
```

## Final Fix

변경 파일:

- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/scripts/check-prod-routes.mjs`
- `docs/worklog/2026-08-23-docs-local-remote-loading-boundary.md`

핵심 변경:

```ts
const renderedArticle = await renderArticleContent(target, {
  codeHighlight: target.contentSource !== "local",
  components,
});
```

배포 전 route timing check 기본 목록에 아래 URL을 추가했다.

```txt
/docs/web/javascript-event-loop-runtime
```

## Operational Rule

로컬 문서 상세는 기본적으로 Shiki를 서버 요청 시점에 실행하지 않는다.

이유:

- 로컬 문서는 evergreen fallback 역할이므로 안정적인 응답 시간이 더 중요하다.
- syntax highlight는 사용자 경험 개선 요소지만, 페이지 전체 timeout을 감수할 만큼 핵심 기능은 아니다.
- 코드 하이라이팅이 꼭 필요하면 build-time highlighting 또는 remote pre-rendered HTML sidecar로 옮기는 편이 안전하다.

## Local Code Block UX

Shiki를 끈다고 해서 로컬 코드 블록을 plain text 상태로 방치하지는 않는다.

로컬 MDX 상세는 가벼운 코드 블록 렌더러를 사용한다.

- 코드 블록 프레임은 CSS 기반으로 렌더링한다.
- 복사 버튼은 작은 client component로 분리한다.
- 언어 라벨은 헤더가 아니라 우측 하단 메타 텍스트로 표시한다.
- syntax highlighting은 lightweight highlighter로 처리한다.
- 하이라이트 출력은 원본 코드를 HTML escape한 뒤 제한된 token span만 삽입한다.

이 기준은 request-time Shiki를 다시 켜지 않으면서도 최소한의 코드 읽기 경험을 제공하기 위한 절충안이다.

정교한 VS Code 수준의 highlighting이 필요하면 다음 경로를 우선 검토한다.

- build-time highlighting
- remote pre-rendered HTML sidecar
- 정적 HTML cache

## Verification Commands

배포 URL 단건 확인:

```bash
/usr/bin/curl -s -o /tmp/heap-forge-doc-current.html \
  -w 'deployed status=%{http_code} total=%{time_total}s starttransfer=%{time_starttransfer}s size=%{size_download}\n' \
  https://heap-forge.app/docs/web/javascript-event-loop-runtime
```

배포 route timing check:

```bash
DOCS_PROD_CHECK_BASE_URL=https://heap-forge.app \
  pnpm --filter docs check:prod-routes \
  /docs/web/javascript-event-loop-runtime /feed /docs
```

로컬 production route timing check:

```bash
CI=true pnpm --filter docs build
cd apps/docs
./node_modules/.bin/next start --port 3003
DOCS_PROD_CHECK_BASE_URL=http://localhost:3003 pnpm --filter docs check:prod-routes
```

## Related Work

- `docs/worklog/2026-08-23-docs-local-remote-loading-boundary.md`
- `docs/architecture/docs-local-vs-remote-content-policy.md`
- `docs/architecture/docs-content-api-fail-fast-policy.md`
- `docs/architecture/docs-remote-code-highlighting-sidecar.md`
- `docs/worklog/2026-08-24-docs-lightweight-code-block-highlighting.md`
- `039ffe6 fix(docs-content): skip shiki for local docs detail`
