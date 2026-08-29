# Docs Page Metadata Policy

## Purpose

HeapForge의 목록, 허브, 정책성 페이지가 공통 canonical, Open Graph, Twitter metadata 규칙을 사용하도록 고정한다.

문서 상세는 `docs-article-metadata-policy.md`를 따른다. 이 문서는 article이 아닌 page-level route를 다룬다.

## Scope

1차 적용 대상:

- `/feed`
- `/docs`
- `/web`
- `/mobile`
- `/ui-ux`
- `/category`
- `/category/{main}`
- `/category/{main}/{sub}`
- `/about`
- `/privacy`
- `/terms`
- `/changelog`

루트 `/`는 site-level metadata를 유지한다.

`/category/{main}/{sub}/{slug}` 상세 alias는 아직 별도 적용하지 않는다. 같은 글이 `/docs/{channel}/{slug}` 또는 `/docs/{routePath}`에서도 접근될 수 있기 때문에, category 상세 canonical을 어디로 보낼지 먼저 확정해야 한다.

## Metadata Source

페이지 metadata copy는 `apps/docs/shared/message/{locale}.json`의 `metadata.pages` 또는 기존 static page metadata에서 가져온다.

기준:

- route별 title/description은 i18n 메시지에서 관리한다.
- `buildPageMetadata()`가 canonical, OG, Twitter 필드를 공통 생성한다.
- image가 없으면 `/og-image.png`를 기본 OG/Twitter image로 사용한다.
- canonical URL은 `DOCS_SITE_URL` origin과 현재 route pathname을 조합한다.

## Route Responsibility

- `/feed`: 큐레이션 피드 metadata
- `/docs`: 검색/색인 metadata
- `/web`, `/mobile`, `/ui-ux`: 채널 허브 metadata
- `/category...`: taxonomy 탐색 metadata
- `/about`, `/privacy`, `/terms`, `/changelog`: 정적 안내 페이지 metadata

## Non-goals

- 검색어 query를 canonical에 포함하지 않는다.
- `/docs?q=...` 검색 결과별 동적 metadata를 만들지 않는다.
- category 상세 alias의 article canonical을 즉시 확정하지 않는다.
- locale alternate link는 별도 i18n SEO 작업으로 남긴다.
