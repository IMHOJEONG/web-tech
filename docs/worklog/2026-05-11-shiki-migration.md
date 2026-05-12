# 2026-05-11 Shiki 전환

## 요약

- docs 앱에서 `Expressive Code` 경로를 제거하고, 로컬 MDX 하이라이팅을 공식 `@shikijs/rehype` 통합으로 전환했다.
- Shiki dual theme는 다음 조합으로 맞췄다.
  - `github-light`
  - `poimandres`
- 기존 `data-theme` 우회 방식은 제거하고, `html.dark .shiki`를 쓰는 공식 class 기반 dark mode CSS 패턴으로 바꿨다.
- 두 MDX 평가 경로가 같은 Shiki rehype plugin을 사용하도록 정리해서 `/docs` 상세와 `/category` 상세의 코드 블록 렌더링이 일관되게 나오게 했다.
- `mdx-components.tsx`도 손봐서, Shiki가 만든 하이라이트 블록 마크업이 기존 클래스와 토큰 스타일을 그대로 유지하도록 했다.

## 이유

`Expressive Code`는 `@next/mdx`와 맞물리면서 loader 직렬화 마찰을 만들었고, 현재 docs 범위 기준으로는 다소 무거운 선택지였다. 반면 Shiki는 더 단순하고 직접적인 하이라이팅 경로를 제공해서 현재 코드베이스에 더 잘 맞는다.

## 파일

- `apps/docs/lib/shiki-options.js`
- `apps/docs/next.config.mjs`
- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/[slug]/page.tsx`
- `apps/docs/mdx-components.tsx`
- `apps/docs/app/css/mdx.css`
- `apps/docs/package.json`
