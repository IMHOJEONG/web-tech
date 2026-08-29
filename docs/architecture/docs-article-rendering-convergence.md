# Docs Article Rendering Convergence

Status: output contract first on 2026-08-29

## Purpose

이 문서는 `apps/docs`에서 local MDX와 remote HTML/markdown을 어떻게 통일할지에 대한 고민과 결정을 남긴다.

목표는 렌더러를 하나로 급하게 합치는 것이 아니라, 사용자에게 보이는 article UI가 source에 따라 달라지지 않도록 만드는 것이다.

## Problem

현재 `apps/docs`는 두 종류의 콘텐츠 source를 사용한다.

- local MDX
  - repository 안의 `apps/docs/data/*`, `apps/docs/category/*`
  - Next.js 서버에서 MDX를 React component로 평가
- remote content
  - content API에서 목록 metadata 조회
  - body endpoint에서 HTML 또는 markdown 본문 조회
  - HTML은 sanitize 후 article layout에 삽입

이 구조는 운영에는 유연하지만, 아래 차이를 만들 수 있다.

- heading id와 TOC 생성 방식 차이
- figure / figcaption 표현 차이
- code block 스타일과 syntax highlight 차이
- table, blockquote, callout 같은 문서 요소의 표현 차이
- local은 React component를 쓸 수 있지만 remote HTML은 바로 React component가 될 수 없는 차이

## Options Considered

### Option 1. Remote MDX Evaluation

remote 문서도 MDX로 받아서 local MDX와 같은 `evaluate()` 경로를 타게 한다.

장점:

- local / remote가 가장 비슷한 렌더링 경로를 가진다.
- MDX component, custom callout, code block component를 한 방식으로 쓸 수 있다.
- 장기적으로 authoring 경험이 가장 일관적일 수 있다.

단점:

- 원격 MDX를 런타임에서 평가해야 하므로 보안 표면이 커진다.
- MDX compile / evaluate 비용이 커져 Vercel 10초 runtime limit 같은 문제가 다시 생길 수 있다.
- Shiki 같은 고비용 하이라이터를 함께 쓰면 cold path가 느려질 수 있다.
- 원격 콘텐츠를 신뢰할 수 있는 코드처럼 다루게 되어 운영 리스크가 커진다.

판단:

- 현재 단계에서는 비추천.
- 실험은 가능하지만 production 기본 경로로 두지 않는다.

### Option 2. HTML-Only Rendering

local MDX도 빌드 또는 authoring 단계에서 HTML로 변환하고, runtime은 HTML만 렌더링한다.

장점:

- 런타임이 단순하고 빠르다.
- remote HTML sanitize / normalize 정책과 잘 맞는다.
- 원격 문서 서버 장애와 renderer 비용을 분리하기 쉽다.

단점:

- local MDX component의 장점이 줄어든다.
- React component 기반 code copy, callout 같은 상호작용을 별도 enhancer로 다시 붙여야 한다.
- local authoring preview 경험이 단조로워질 수 있다.

판단:

- 성능과 보안은 좋지만 지금 바로 전환하기에는 local MDX 장점을 너무 많이 버린다.

### Option 3. Markdown-First Pipeline

local / remote 원본은 모두 markdown으로 두고, 동일한 markdown pipeline에서 article HTML을 만든다.

장점:

- 작성 원본의 일관성이 높다.
- remote sidecar와 frontend가 같은 계약을 공유하기 좋다.
- 장기적으로 content repository 운영과 잘 맞는다.

단점:

- FastAPI `mistune`과 frontend `remark/rehype` 결과가 다를 수 있다.
- 어느 쪽이 최종 renderer인지 다시 결정해야 한다.
- migration 비용이 있다.

판단:

- 장기 실험 후보로 좋다.
- 지금 당장 production 기본값으로 바꾸기에는 변환 파이프라인 검증이 부족하다.

### Option 4. Keep Current Sources, Unify Output Contract

local은 MDX, remote는 sanitized HTML/markdown을 유지한다.

대신 article layout에 들어가기 전 최종 출력 계약을 통일한다.

장점:

- 현재 구조를 크게 흔들지 않는다.
- local authoring과 remote 운영을 둘 다 유지할 수 있다.
- remote MDX evaluation 같은 보안/성능 리스크를 피한다.
- heading, TOC, figure, code block 같은 사용자-facing 요소를 점진적으로 맞출 수 있다.

단점:

- 내부 renderer는 여전히 둘이다.
- remote HTML normalization 코드가 필요하다.
- React component가 필요한 기능은 remote HTML에 바로 붙지 않는다.

판단:

- 현재 프로젝트의 기본 정책으로 채택한다.

## Decision

현재는 Option 4를 채택한다.

즉:

- local MDX는 유지한다.
- remote HTML은 sanitize 후 normalize한다.
- 사용자에게 보이는 article UI는 공통 출력 계약을 따른다.
- 다른 대안은 별도 실험 branch 또는 spike 문서에서 검증 후 교체 가능성을 판단한다.

## Output Contract

article renderer가 source와 관계없이 맞춰야 하는 최소 계약은 다음과 같다.

### Heading

- `h1`은 frontmatter title이 담당한다.
- 본문 heading은 `h2` 또는 `h3`부터 시작한다.
- heading에는 anchor 이동을 위한 `id`가 있어야 한다.
- TOC는 heading id와 같은 href를 사용한다.

### Figure

- 이미지 단독 문단 또는 이미지 + 강조 텍스트 caption은 `figure > img + figcaption` 구조로 정규화한다.
- 이미지는 article 본문 안에서 가운데 정렬한다.
- caption은 본문보다 낮은 대비와 작은 크기를 사용한다.

### Code Block

- code block은 `.mdx-code-frame`으로 감싼다.
- 실제 코드 영역은 `.mdx-code-block`을 사용한다.
- 언어 라벨은 `.mdx-code-frame__language`로 우측 하단에 둔다.
- local MDX는 React component 기반 copy button을 가진다.
- remote HTML은 같은 frame / language / lightweight highlight를 보장한다.
- remote HTML copy button은 client enhancer로 부착한다.

### Table

- table은 `.mdx-table-scroll`로 감싼다.
- 실제 table은 `.mdx-table` class를 사용한다.
- 작은 화면에서는 page 전체가 아니라 table wrapper 내부에서만 가로 스크롤한다.
- wrapper는 keyboard focus가 가능해야 하며, focus ring은 design token을 따른다.

### Blockquote

- blockquote는 `.mdx-blockquote` class를 사용한다.
- local MDX와 remote HTML 모두 같은 border, background, spacing token을 공유한다.
- blockquote 내부 첫/마지막 요소의 margin을 정리해 source별 여백 차이를 줄인다.

### Callout

- callout은 아직 production authoring 문법으로 고정하지 않는다.
- `> [!NOTE]` 같은 markdown convention, MDX component, remote HTML data attribute 중 하나를 별도 spike로 비교한다.
- 문법이 정해지기 전에는 blockquote를 callout처럼 과하게 꾸미지 않는다.

### Common Styling

- typography, color, radius, shadow는 `mdx.css`와 design token 계층을 사용한다.
- source별 inline style에 의존하지 않는다.
- dark mode에서도 code, link, inline code 대비가 유지되어야 한다.

## Applied Scope

2026-08-29 기준 1차 적용:

- remote HTML heading id / TOC normalize 유지
- remote image caption paragraph를 `figure / figcaption`으로 normalize 유지
- remote HTML `<pre><code class="language-*">`를 `.mdx-code-frame` 출력 계약으로 normalize
- remote code block에 lightweight syntax highlight 적용
- local MDX와 remote HTML code block이 같은 CSS token을 공유
- remote HTML code block에 client enhancer로 copy button 부착
- local MDX와 remote HTML table을 `.mdx-table-scroll` / `.mdx-table` 계약으로 통일
- remote HTML blockquote에 `.mdx-blockquote` class를 부착하고 공통 여백 규칙 적용

## Future Experiments

다른 대안은 production 기본값을 바꾸기 전에 작은 spike로 검증한다.

검증 후보:

- remote MDX evaluation spike
- markdown-first sidecar spike
- HTML-only pre-render spike
- remote HTML client enhancer의 keyboard / clipboard failure UX 점검
- callout authoring syntax spike

검증 기준:

- Vercel cold path가 10초 제한에 걸리지 않는가?
- remote content를 신뢰 코드처럼 평가하지 않는가?
- local / remote article UI가 실제로 동일하게 보이는가?
- 작성자가 추가로 배워야 하는 규칙이 과하지 않은가?
- 장애 시 local fallback이 유지되는가?

## Related Docs

- [docs-content-rendering-strategy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-rendering-strategy.md)
- [docs-content-operating-model.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-operating-model.md)
- [blog-content-html-vs-markdown.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-html-vs-markdown.md)
- [docs-local-mdx-shiki-timeout-analysis.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-local-mdx-shiki-timeout-analysis.md)
