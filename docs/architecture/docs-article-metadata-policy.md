# Docs Article Metadata Policy

## Purpose

HeapForge 문서 상세 페이지가 사이트 공통 metadata가 아니라 문서별 title, summary, canonical URL, image를 사용하도록 정책을 고정한다.

## Scope

우선 적용 대상은 canonical 상세 라우트다.

```txt
/docs/{channel}/{articleSlug}
```

예:

- `/docs/web/javascript-event-loop-runtime`
- `/docs/feed/pna`
- `/docs/ui-ux/blocked-aria-hidden`
- `/docs/mobile/touch-targets`

`/category/...` 상세는 legacy/category browsing route 성격이 강하므로, canonical 정책을 더 닫은 뒤 별도 적용한다.

목록, 허브, 정적 페이지 metadata는 별도 page-level 정책인 `docs-page-metadata-policy.md`를 따른다.

## Metadata Source Priority

문서 상세 metadata는 article payload를 기준으로 만든다.

필드 기준:

- `title`: metadata title, OG title, Twitter title
- `summary`: description, OG description, Twitter description
- `markdownPath`: canonical route 계산의 1순위 source
- `slug`: leaf fallback
- `thumbnail`: OG/Twitter image
- `date`: article published time
- `updatedAt`: article modified time
- `authorName`: author metadata
- `tags`: keyword/tag metadata
- `topicLabel`: article section metadata

## Canonical URL Rule

상세 페이지 canonical URL은 항상 `getDocHref()` 결과를 `DOCS_SITE_URL` origin에 붙여 만든다.

예:

```txt
DOCS_SITE_URL=https://heap-forge.app
markdownPath=web/javascript-event-loop-runtime
canonical=https://heap-forge.app/docs/web/javascript-event-loop-runtime
```

즉 metadata canonical과 실제 redirect canonical은 같은 route 계산 함수를 공유해야 한다.

## Image Rule

문서 thumbnail이 있으면 OG/Twitter image로 사용한다.

우선순위:

1. `thumbnail`이 absolute URL이면 그대로 사용한다.
2. `thumbnail`이 protocol-relative URL이면 `https:`를 붙인다.
3. `thumbnail`이 relative path이면 `DOCS_SITE_URL` 기준 절대 URL로 만든다.
4. `thumbnail`이 없으면 `/og-image.png`를 fallback으로 사용한다.

## Request Cost Rule

`generateMetadata()`와 page render는 같은 상세 문서를 필요로 한다.

따라서 `/docs/[...slugParts]` route에서는 `cache(getDocByRoutePath)`를 사용해 같은 request 안에서 문서 조회 결과를 재사용한다.

## Non-goals

- 검색 결과 metadata를 동적으로 만든다.
- `/category/...` legacy detail route에 canonical metadata를 즉시 적용한다.
- locale별 alternate link를 이 작업에서 함께 확장한다.
