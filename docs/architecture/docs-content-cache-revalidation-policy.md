# Docs Content Cache Revalidation Policy

## Status

- Adopted
- Applied scope: `apps/docs` remote content index and article body fetches
- Runtime: Next.js on Vercel
- Source: `apps/docs-backend` on NAS

## Context

`apps/docs-backend` reads Markdown files from the NAS volume for every request. Its
responses therefore reflect a valid file change immediately and use
`Cache-Control: private, no-store`.

`apps/docs`, however, caches remote index and body requests with
`BLOG_CONTENT_REVALIDATE_SECONDS`. The default value is 300 seconds. This protects
page latency and NAS availability, but it also means that editing a NAS file alone
does not immediately update the public page.

The frontend cannot detect a NAS filesystem change by itself. An explicit signal
must cross the NAS-to-Vercel boundary when published content changes.

## Decision

Use a hybrid cache policy:

1. Keep the 300-second TTL as the fallback expiration policy.
2. Tag every remote content index and article body fetch with
   `docs-content:remote`.
3. Expose a protected `POST /api/revalidate/content` Route Handler on `apps/docs`.
4. After a document has been saved and validated, call the Route Handler from the
   authoring environment.
5. Expire the tag with `revalidateTag(tag, { expire: 0 })` so the next reader waits
   for a fresh API response instead of receiving stale content once more.

The invalidation request does not proactively download all documents. It expires
the matching cache entries. The next request fetches only the data needed for that
page and stores the fresh result.

## Why TTL Remains Enabled

The webhook is an optimization for publication freshness, not the only expiration
mechanism. Keeping the TTL means content eventually refreshes when:

- an operator forgets to call the webhook;
- the webhook temporarily fails;
- the authoring script is unavailable;
- a cache invalidation request is interrupted.

Setting `BLOG_CONTENT_REVALIDATE_SECONDS=0` permanently is not adopted because it
would couple every page request to NAS latency and availability.

## Invalidation Scope

The initial implementation uses one shared tag for both the remote index and all
remote article bodies.

Advantages:

- index and detail caches are expired together;
- metadata and body changes cannot remain on different TTL timelines;
- the NAS publishing command stays simple;
- the number of cache tags remains small.

If the content volume becomes large or publication frequency increases, this can
be refined into an index tag plus a tag per canonical document path.

## Authentication Policy

The revalidation endpoint is a server-to-server administration endpoint.

- Accept `POST` only.
- Require `Authorization: Bearer <token>`.
- Store the expected value in Vercel as `BLOG_CONTENT_REVALIDATE_TOKEN`.
- Use a separate secret from `BLOG_CONTENT_API_TOKEN`.
- Never use a query-string token because URLs can be retained in logs and history.
- Never log the supplied token.
- Return the same `401 Unauthorized` response for missing and invalid tokens.
- Set `Cache-Control: private, no-store` on every response.

The NAS-side token should be stored in a file outside the repository. Neither the
Vercel token nor the NAS token file is committed to Git.

## Publication Flow

```text
Edit Markdown on NAS
  -> validate frontmatter and rendered API response
  -> POST the protected Vercel revalidation endpoint
  -> expire docs-content:remote
  -> next page request fetches fresh index/body data
```

File watching is intentionally deferred. Editors can produce temporary writes,
renames, and multiple save events, so a watcher can invalidate partially written
or invalid content. The first operational step is an explicit publish command.

## Failure Policy

- A failed revalidation call must not modify or delete the Markdown source.
- A `401` means the NAS and Vercel revalidation secrets do not match.
- A `404` means the frontend deployment does not yet contain the Route Handler.
- A `5xx` or timeout is retriable after checking Vercel runtime logs.
- If invalidation remains unavailable, the normal TTL refreshes content within the
  configured interval.
- Existing local-document fallback and remote API fail-fast policies remain
  unchanged.

## Observability

Successful invalidation writes one Vercel Runtime Log entry containing only the
cache tag and UTC timestamp. Failed authentication never logs a supplied token.

The caller prints the HTTP failure status or the successful invalidation time. A
successful webhook response does not prove that the Markdown is valid, so the
remote API must be checked before invalidation during publication.

## Future Automation

After the explicit publication flow is stable, evaluate these options in order:

1. Wrap validation and revalidation in one authoring command.
2. Add retry with bounded exponential backoff.
3. Warm only the changed canonical route after invalidation.
4. Introduce per-document cache tags if full invalidation becomes expensive.
5. Consider a debounced filesystem watcher only when edits are atomic and
   validation runs before notification.

## References

- `docs/architecture/docs-content-rendering-strategy.md`
- `docs/architecture/docs-content-api-fail-fast-policy.md`
- `docs/architecture/docs-content-authoring-pipeline.md`
- `docs/runbooks/docs-backend-nas-deployment.md`
