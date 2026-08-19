# 2026-08-08 Docs Search Results Smoke Test

## What Changed

`/docs` 검색 페이지의 상태 분기 로직을 helper로 분리하고, 검색 결과 화면에 대한 smoke test를 추가했다.

검증 대상 상태:

- `/docs`
- `/docs?q=...` 검색 결과 있음
- `/docs?q=...` 검색 결과 없음
- base docs index 자체가 비어 있는 경우

## Code Changes

대상 파일:

- `apps/docs/lib/docs-search-page-state.ts`
- `apps/docs/lib/docs-search-page-state.test.ts`
- `apps/docs/app/docs/page.tsx`

적용 내용:

- docs search page state resolver 추가
- 추천 검색어 목록을 공용 상수로 승격
- page 엔트리는 `resolveDocsSearchPageState()` 결과에 따라 화면을 분기
- 검색 결과 UI와 empty state UI 분기 조건을 테스트로 고정

## Why

이전에는 `/docs` page 내부에서 상태 분기가 직접 이루어지고 있었고, 다음 규칙이 회귀 없이 유지되는지 테스트하기 어려웠다.

- keyword가 없으면 docs index
- keyword가 있고 결과가 없으면 empty search state
- keyword가 있고 결과가 있으면 search result state
- docs index 데이터 자체가 비어 있으면 empty-all-docs state

이번 작업으로 검색 페이지 분기 규칙을 순수 함수로 검증할 수 있게 됐고, 검색 UX 회귀를 더 빠르게 잡을 수 있게 됐다.

## Verification

실행한 검증:

- `node --experimental-strip-types --test apps/docs/lib/docs-search-page-state.test.ts`
- `node --experimental-strip-types --test apps/docs/lib/docs-search-page-state.test.ts apps/docs/lib/content-api-schema.test.ts apps/docs/lib/get-doc-route.test.ts apps/docs/lib/editorial-metadata.test.ts apps/docs/lib/search-ranking.test.ts apps/docs/lib/render-article-content.test.ts`
- `node --test apps/docs/scripts/validate-content.test.mjs`
- `node apps/docs/scripts/validate-content.mjs`

결과:

- docs lib test 총 `27`개 통과
- content validation test `5`개 통과
- local content frontmatter validation 통과

## Follow-Up

다음 우선순위 후보:

1. test:lib 실행 범위를 CI/workflow에 반영할지 검토
2. remote payload field-level stricter validation 범위 검토
3. search excerpt highlight 설계
