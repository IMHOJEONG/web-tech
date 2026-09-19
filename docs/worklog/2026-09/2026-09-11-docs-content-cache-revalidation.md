# 2026-09-11 Docs Content Cache Revalidation

## Goal

Keep the existing remote-content TTL while allowing a validated NAS content
change to invalidate the Vercel cache on demand.

## Applied

- Added the shared `docs-content:remote` cache tag to remote index and body fetches.
- Added the protected `POST /api/revalidate/content` Route Handler.
- Used immediate expiration for the next request with
  `revalidateTag(tag, { expire: 0 })`.
- Added constant-time Bearer token comparison and unit coverage.
- Added a NAS-safe caller script that reads its token from a file.
- Kept `BLOG_CONTENT_REVALIDATE_SECONDS=300` as the missed-webhook fallback.
- Documented authentication, failure, verification, and future automation policy.

## Security Boundary

- The read-side content API token and the write-side cache invalidation token stay
  separate.
- The revalidation token is never accepted through a query string.
- No secret value is written to application logs or committed configuration.

## Deferred

- Automatic filesystem watching
- Per-document cache tags
- Route warming after publication
- Retry automation

These are deferred until the explicit publish flow is verified on NAS and Vercel.
