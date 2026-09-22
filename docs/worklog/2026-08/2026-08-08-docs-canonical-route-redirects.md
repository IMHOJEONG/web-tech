# 2026-08-08 Docs Canonical Route Redirects

## What Changed

`apps/docs` 상세 문서 라우트에 canonical redirect 처리를 추가했다.

원칙:

- match는 유연하게 허용
- 공개 URL은 canonical 한 곳으로 수렴

즉 legacy alias나 비정규 경로로 들어오더라도, 실제 문서 렌더링 전 `/docs/{channel}/{slug}`로 redirect 한다.

## Code Changes

### Route Helper

- `apps/docs/lib/get-doc-route.ts`

추가/변경 내용:

- 요청 route path 정규화 유틸 추가
- source 기준 alias 집합 계산 추가
- `isDocRouteMatch`가 canonical path 외에도 source 기반 alias를 허용하도록 변경
- `shouldRedirectToCanonicalDocRoute` 추가

현재 alias match 대상:

- `slug`
- `markdownPath`
- `fileName`
- `path`
- trailing duplicate leaf가 있는 경로의 정규화 형태

예:

- `feed/pna/pna`
  - `feed/pna`로 정규화 후 canonical redirect
- raw local path 기반 alias
  - source match 후 canonical redirect 가능

### Docs Detail Page

- `apps/docs/app/docs/[...slugParts]/page.tsx`

적용 내용:

- target 문서를 찾은 뒤, 요청 경로가 canonical path와 다르면 `permanentRedirect` 수행
- 이후에만 실제 HTML/MDX 렌더링 진행

## Why

이전에는 문서 route 계산은 canonical 기준이 있었지만, 실제 상세 페이지는 alias를 canonical로 수렴시키지 않았다.

그 결과:

- legacy route가 그대로 남을 수 있고
- 링크 공유 시 비정규 경로가 퍼질 수 있으며
- SEO/운영 관점에서도 한 문서가 여러 URL로 보일 여지가 있었다.

이번 작업으로 “상세 문서의 대표 URL은 하나”라는 규칙을 실제 코드에 반영했다.

## Verification

- `pnpm --filter docs typecheck`
- `pnpm --filter docs lint`

## Follow-Up

다음 우선순위 후보:

1. search relevance scoring 초안
2. build-time frontmatter validation
3. route alias 케이스에 대한 유닛 테스트 추가
