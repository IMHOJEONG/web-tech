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
- 관련 테스트를 추가했다.

## Follow-Up

- remote HTML client enhancer로 copy button을 붙일지 검토
- callout / table / blockquote의 source별 표현 차이 점검
- markdown-first sidecar spike
- HTML-only pre-render spike
