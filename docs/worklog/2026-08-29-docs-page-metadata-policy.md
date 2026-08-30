# 2026-08-29 Docs Page Metadata Policy

## Context

문서 상세 metadata는 `/docs/{channel}/{slug}` 중심으로 정리했지만, 목록/허브/정적 페이지는 여전히 route별 수동 metadata이거나 metadata 자체가 없는 상태였다.

특히 `/feed`, `/docs`, `/web`, `/mobile`, `/ui-ux`는 검색 결과나 공유 미리보기에서 site-level metadata에 의존할 수 있어 각 페이지의 역할이 덜 드러날 수 있었다.

## Changes

- `buildPageMetadata()`를 추가해 page-level canonical, Open Graph, Twitter metadata 생성을 공통화했다.
- `normalizeMetadataImageUrl()`를 `seo.ts`로 이동해 article/page metadata가 같은 image fallback 규칙을 사용하게 했다.
- `metadata.pages` 메시지 키를 `ko/en`에 추가했다.
- `/feed`, `/docs`, `/web`, `/mobile`, `/ui-ux`, `/category`, `/category/{main}`, `/category/{main}/{sub}`에 page metadata를 연결했다.
- `/about`, `/privacy`, `/terms`, `/changelog`의 기존 metadata도 같은 builder를 사용하도록 변경했다.
- `/category`를 정적 sitemap 경로에 포함했다.

## Decision

상세 문서와 페이지 metadata를 분리한다.

- 상세 문서: `docs-article-metadata-policy.md`
- 목록/허브/정적 페이지: `docs-page-metadata-policy.md`

`/category/{main}/{sub}/{slug}` 상세 alias는 이번 작업에서 제외했다. category 상세는 동일 문서가 다른 URL로 노출될 수 있으므로, canonical route 정책을 더 닫은 뒤 적용한다.

## Verification

- `page-metadata.test.ts`로 canonical URL, default OG image, remote OG image 동작을 검증한다.
- 기존 `article-metadata.test.ts`는 공통 image 정규화 이동 이후에도 같은 결과를 유지해야 한다.
