# 2026-08-08 Docs Detail Render Smoke Test

## What Changed

`apps/docs` 상세 문서 렌더 경로를 helper로 분리하고, `html` / `mdx` 두 분기에 대한 smoke test를 추가했다.

## Code Changes

대상 파일:

- `apps/docs/lib/render-article-content.ts`
- `apps/docs/lib/render-article-content.test.ts`
- `apps/docs/lib/slugify-heading.ts`
- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/widgets/article-detail/model/normalize-remote-article-html.ts`
- `apps/docs/mdx-components.tsx`

적용 내용:

- docs detail page 내부의 렌더 분기 로직을 `renderArticleContent()` helper로 이동
- remote HTML branch는 heading id 정규화와 TOC 추출을 유지
- local MDX branch는 기존 `remark-flexible-toc` + `rehypeShiki` 기준을 helper에서 공통 실행
- heading slug 생성 로직을 공용 유틸로 분리

## Why

이전에는 상세 렌더 경로가 page 파일 안에 직접 들어 있어 테스트하기가 어려웠다.

그 결과:

- remote HTML branch
- local MDX branch

둘 중 하나가 깨져도 page 단위에서만 늦게 드러날 가능성이 있었다.

이번 작업으로 렌더 핵심 경로를 독립적으로 검증할 수 있게 됐고, 상세 페이지 회귀를 더 빠르게 잡을 수 있게 됐다.

## Verification

실행한 검증:

- `node --experimental-strip-types --test apps/docs/lib/render-article-content.test.ts`
- `node --experimental-strip-types --test apps/docs/lib/content-api-schema.test.ts apps/docs/lib/get-doc-route.test.ts apps/docs/lib/editorial-metadata.test.ts apps/docs/lib/search-ranking.test.ts apps/docs/lib/render-article-content.test.ts`
- `node --test apps/docs/scripts/validate-content.test.mjs`
- `node apps/docs/scripts/validate-content.mjs`

결과:

- docs lib test 총 `22`개 통과
- content validation test `5`개 통과
- local content frontmatter validation 통과

## Follow-Up

다음 우선순위 후보:

1. `/docs?q=...` 검색 결과 스모크 테스트 추가
2. remote payload field-level stricter validation 범위 검토
3. search excerpt highlight 설계
