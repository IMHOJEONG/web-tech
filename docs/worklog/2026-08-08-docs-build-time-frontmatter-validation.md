# 2026-08-08 Docs Build-Time Frontmatter Validation

## What Changed

`apps/docs`에 local content frontmatter를 build 전에 검증하는 흐름을 추가했다.

핵심 목적:

- 잘못된 메타데이터가 조용히 배포되는 것을 막는다.
- `draft`와 `published` 문서를 다른 규칙으로 취급한다.
- contributor가 publish 전에 같은 기준을 직접 확인할 수 있게 한다.

## Code Changes

### Shared Metadata Rules

- `apps/docs/lib/editorial-metadata.ts`

추가한 내용:

- local slug 패턴 상수
- local frontmatter zod schema
- `published` / `draft|archived` 분기 검증
- public 노출 가능 status 판별 유틸
- frontmatter 검증 에러 메시지 포맷 유틸

### Runtime Consumers

- `apps/docs/lib/get-document.ts`
- `apps/docs/lib/get-category.ts`
- `apps/docs/lib/get-search-data.ts`
- `apps/docs/lib/content-api-normalize.ts`

적용 내용:

- local frontmatter를 읽을 때 즉시 검증
- `draft` / `archived` 문서는 public data/search/category 목록에서 제외
- remote payload도 non-public status면 노출하지 않도록 정리

### Build-Time Script

- `apps/docs/scripts/validate-content.mjs`
- `apps/docs/package.json`

추가한 내용:

- `pnpm --filter docs validate:content`
- `prebuild`에서 validation 실행

스크립트는 외부 패키지 없이 동작하도록 작성해, 현재처럼 `node_modules` 상태가 불완전한 환경에서도 직접 실행 가능하게 했다.

## Content Cleanup

placeholder 성격이던 아래 문서는 draft frontmatter를 추가했다.

- `apps/docs/category/be/nodejs/service.mdx`
- `apps/docs/category/computer-science/os/test.mdx`

이 문서들은 이제 validation을 통과하면서도 public 목록에는 노출되지 않는다.

## Validation Rules

### Published

- `title` 필수
- `slug` 필수
- `date` 필수
- `summary` 필수

### Draft / Archived

- `title` 필수
- `slug` 필수
- public 목록/검색/카테고리 overview에서는 제외

## Verification

이 환경에서는 `pnpm`가 registry/network 및 로컬 `node_modules` 상태 문제로 정상 검증까지 이어지지 못했다.

대신 다음을 확인했다.

- dependency-free `validate-content.mjs`로 전환
- runtime consumer에 public status filtering 연결
- placeholder draft 문서 정리

후속으로 의존성 환경이 정상인 곳에서는 아래를 다시 확인해야 한다.

- `pnpm --filter docs validate:content`
- `pnpm --filter docs typecheck`
- `pnpm --filter docs lint`
