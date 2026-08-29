# 2026-08-29 Docs Metadata Base

## 배경

Next metadata에서 Open Graph image 같은 URL을 상대 경로로 선언하면, 배포 환경에 따라 metadata base가 명확하지 않다는 경고나 비일관성이 생길 수 있다.

HeapForge docs는 이미 `DOCS_SITE_URL`을 robots/sitemap의 canonical origin으로 쓰고 있으므로, 같은 값을 root metadata의 `metadataBase`에도 연결했다.

## 적용 내용

- `apps/docs/lib/seo.ts`에 `getMetadataBase()`를 추가했다.
- `apps/docs/app/layout.tsx`의 root `generateMetadata()`에 `metadataBase`를 설정했다.
- `DOCS_SITE_URL`에 path가 들어오더라도 metadata base는 origin만 사용하도록 테스트를 추가했다.
- SEO metadata route runbook에 `metadataBase` 정책을 추가했다.

## 정책

- canonical site origin은 `DOCS_SITE_URL`을 우선 사용한다.
- `DOCS_SITE_URL`이 없거나 잘못되면 `https://heap-forge.app`으로 fallback한다.
- `metadataBase`는 origin 단위로만 사용하고 path는 포함하지 않는다.
- 개별 page metadata는 title/description 등 페이지별 copy만 덮고, site-level base는 root layout에서 관리한다.

## 검증 예정

- `pnpm --filter docs test:lib`
- `pnpm --filter docs lint`
- `pnpm --filter docs typecheck`
