# 2026-08-08 Docs Editorial Metadata Schema Fixation

## What Changed

`apps/docs`의 local MDX frontmatter와 remote content payload가 공통 editorial metadata 규칙을 사용하도록 정리했다.

핵심 변경:

- 공용 metadata 정규화 유틸 추가
- local docs/category/search 파서에서 공통 정규화 사용
- remote payload 정규화도 같은 기준으로 통일
- local 문서 `id`를 절대경로 기반 값에서 안정적인 상대경로 기반 값으로 변경

## Code Changes

### New Shared Utility

- `apps/docs/lib/editorial-metadata.ts`

추가한 내용:

- `status` enum
- `readMinutes` 정규화
- `tags` 정규화
- local frontmatter 정규화
- remote editorial metadata 정규화

### Updated Consumers

- `apps/docs/lib/get-document.ts`
- `apps/docs/lib/get-category.ts`
- `apps/docs/lib/get-search-data.ts`
- `apps/docs/lib/content-api-normalize.ts`
- `apps/docs/lib/content-api-types.ts`

적용 내용:

- `updatedAt`, `tags`, `status`를 공용 메타 필드로 반영
- author / role / read time / topic label alias 정규화를 공통 유틸로 이동
- local/search/category parsing에서 같은 frontmatter 해석 규칙 사용

## Why

이전에는:

- local MDX
- category MDX
- search indexing
- remote payload normalization

이 각각 메타데이터를 조금씩 다르게 해석하고 있었다.

이 상태에서는:

- 새 메타 필드 추가 시 누락 가능성이 높고
- 카드/검색/상세 간 표현이 어긋날 수 있으며
- local `id`가 머신 경로에 묶여 안정성이 떨어질 수 있었다.

이번 작업으로 메타데이터 규칙과 안정적인 식별 기준을 먼저 고정했다.

## Verification

- `pnpm --filter docs typecheck`
  - 통과

## Follow-Up

다음 우선순위로 이어갈 만한 항목:

1. canonical route redirect / alias 처리 실제 구현
2. search relevance scoring 초안
3. frontmatter validation CLI 또는 build-time 검증 추가
