# Docs Article Rendering Convergence

Date: 2026-08-29

## Context

local MDX와 remote HTML/markdown을 어떻게 통일할지 결정이 필요했다.

완전한 renderer 단일화는 매력적이지만, remote MDX evaluation은 보안/성능 리스크가 크고 이전 Shiki/Vercel timeout 이슈와도 연결될 수 있다.

## Decision

Option 4를 채택한다.

- local MDX는 유지한다.
- remote HTML은 sanitize 후 normalize한다.
- 최종 article UI의 output contract를 통일한다.
- 다른 대안은 production 기본값 변경 전 spike로 검증한다.

## Applied

- `docs/architecture/docs-article-rendering-convergence.md`를 추가했다.
- `docs-content-rendering-strategy.md`에 local/remote rendering convergence 기준을 연결했다.
- remote HTML `<pre><code class="language-*">`를 `.mdx-code-frame` / `.mdx-code-block` / `.mdx-code-frame__language` 구조로 normalize했다.
- remote code block도 lightweight syntax highlight를 적용하도록 했다.
- remote HTML code block에 client-side copy button enhancer를 붙였다.
- local MDX와 remote HTML table을 `.mdx-table-scroll` / `.mdx-table` 구조로 맞췄다.
- remote HTML blockquote에 `.mdx-blockquote` class를 부착하고 공통 여백 규칙을 적용했다.
- `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]` callout marker를 `.mdx-callout` 구조로 normalize했다.
- callout marker 판정은 `feature/callout/model` 공용 로직으로 분리했다.
- contributor guide에 callout/table 작성 규칙을 추가했다.
- content style validator에서 callout marker 위치와 지원 marker를 검증하도록 했다.
- local 문서 3개에 callout 예제를 추가했다.
  - `HTML-in-Canvas에 대해 알아봅시다`: `NOTE`
  - `Server Component와 Client Component 경계`: `TIP`
  - `HTTP Timeout과 Retry 경계`: `WARNING`
- 관련 테스트를 추가했다.

## Follow-Up

- remote HTML client enhancer의 keyboard / clipboard failure UX 점검
- callout variant 확장 필요성 점검
- markdown-first sidecar spike
- HTML-only pre-render spike
