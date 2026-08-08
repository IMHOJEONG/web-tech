# 2026-08-08 Docs Remote Payload Schema Validation

## What Changed

`apps/docs` remote content API 응답에 payload boundary validation을 추가했다.

이제 `/api/posts` 응답은 normalize 단계 전에 먼저 schema 검증을 거친다.

## Code Changes

대상 파일:

- `apps/docs/lib/content-api-schema.ts`
- `apps/docs/lib/content-api-schema.test.ts`
- `apps/docs/lib/content-api.ts`

적용 내용:

- remote post entry schema 추가
- top-level array payload 허용
- `{ items: [...] }` wrapper 허용
- `{ results: [...] }` wrapper 허용
- wrapper는 맞지만 내부 entry가 object shape가 아니면 reject
- unsupported container shape는 reject

`fetchRemotePostsPayload()`는 이제 `response.json()` 결과를 바로 신뢰하지 않고, schema helper를 통해 유효한 post 배열만 다음 단계로 넘긴다.

## Why

이전에는 upstream payload가 아래처럼 깨져도 런타임에서 뒤늦게 드러날 수 있었다.

- `results`가 배열이 아님
- post entry가 string / number 같은 잘못된 타입
- wrapper key가 계약과 다름

이 경우 오류 지점이 normalize / route / render 단계로 뒤로 밀리면서 원인 파악이 어려웠다.

이번 작업으로 payload 경계에서 먼저 실패시키고, “API contract가 깨졌다”는 의미를 더 빠르게 드러낼 수 있게 됐다.

## Verification

실행한 검증:

- `node --experimental-strip-types --test apps/docs/lib/content-api-schema.test.ts`
- `node --experimental-strip-types --test apps/docs/lib/get-doc-route.test.ts apps/docs/lib/editorial-metadata.test.ts apps/docs/lib/search-ranking.test.ts apps/docs/lib/content-api-schema.test.ts`
- `node --test apps/docs/scripts/validate-content.test.mjs`
- `node apps/docs/scripts/validate-content.mjs`

결과:

- content-api schema test 통과
- docs lib test 총 `20`개 통과
- content validation test `5`개 통과
- local content frontmatter validation 통과

## Follow-Up

다음 우선순위 후보:

1. docs detail render smoke test 추가
2. `/docs?q=...` 검색 결과 스모크 테스트 추가
3. remote payload field-level stricter validation 범위 검토
