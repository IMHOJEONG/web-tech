# 2026-08-29 Docs Article Metadata Policy

## 배경

`metadataBase`를 site-level로 고정했지만, `/docs/{channel}/{articleSlug}` 상세 페이지는 아직 글별 metadata를 만들지 않았다.

그 결과 공유 카드나 검색엔진 metadata가 사이트 공통값에 기대거나, 문서별 title/summary/thumbnail/canonical URL을 충분히 표현하지 못할 수 있었다.

## 적용 내용

- article detail metadata 정책 문서를 추가했다.
- `apps/docs/lib/article-metadata.ts`에 문서별 metadata builder를 추가했다.
- `/docs/[...slugParts]` route에 `generateMetadata()`를 추가했다.
- `generateMetadata()`와 page render가 같은 문서 조회를 공유하도록 `cache(getDocByRoutePath)`를 적용했다.
- canonical URL, local thumbnail, remote thumbnail, fallback OG image 테스트를 추가했다.

## 정책

- `/docs/{channel}/{articleSlug}`를 article metadata의 우선 적용 대상으로 둔다.
- canonical URL은 `getDocHref()`와 `DOCS_SITE_URL` 기준으로 만든다.
- thumbnail이 있으면 OG/Twitter image로 쓰고, 없으면 `/og-image.png`를 사용한다.
- `/category/...` 상세 metadata는 category route 정책을 더 닫은 뒤 별도 작업으로 적용한다.

## 검증 예정

- `pnpm --filter docs test:lib`
- `pnpm --filter docs lint`
- `pnpm --filter docs typecheck`
