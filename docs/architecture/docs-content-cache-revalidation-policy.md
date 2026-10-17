# Docs Content Cache Revalidation Policy

## 상태와 범위

- 상태: 적용 중
- 대상: docs 원격 콘텐츠 목록·본문 캐시 및 로컬 검색 인덱스
- 최종 검토: 2026-10-08
- Runtime: Next.js on Vercel
- Source: `apps/docs-backend` on NAS

## 배경

`apps/docs-backend` reads Markdown files from the NAS volume for every request. Its
responses therefore reflect a valid file change immediately and use
`Cache-Control: private, no-store`.

`apps/docs`, however, caches remote index and body requests with
`BLOG_CONTENT_REVALIDATE_SECONDS`. The default value is 300 seconds. This protects
page latency and NAS availability, but it also means that editing a NAS file alone
does not immediately update the public page.

The frontend cannot detect a NAS filesystem change by itself. An explicit signal
must cross the NAS-to-Vercel boundary when published content changes.

## 결정

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

## 대안과 영향

### Why TTL Remains Enabled

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

## 로컬 검색 인덱스의 독립 캐시

[ADR-0011](adr-0011-local-search-index-cache.md)에 따라 Production 로컬 인덱스만 별도 300초 캐시로 재사용한다. 태그는 `docs-content:local-search`이며 인증된 웹훅은 원격 태그와 함께 `{ expire: 0 }`으로 만료한다. 검색어별 결과와 원격 실패 fallback은 캐시하지 않는다. 개발 환경은 우회하고 새 배포는 문서 내용 digest가 다른 키를 사용한다. NAS 게시로 배포된 로컬 파일 자체가 바뀌지는 않는다.

시간 기반 갱신은 stale-while-revalidate 동작일 수 있으므로 300초를 게시 내용의 강제 반영 시한으로 해석하지 않는다. 즉시 만료가 필요한 게시에는 웹훅을 사용한다.

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

The token is reviewed and rotated under
`docs/architecture/docs-secret-token-lifecycle-policy.md`. It must remain separate
from the Content API read token.

## Publication Flow

```text
Edit Markdown on NAS
  -> validate frontmatter and rendered API response
  -> POST the protected Vercel revalidation endpoint
  -> expire docs-content:remote
  -> next page request fetches fresh index/body data
  -> verify expected title/summary/body in public index, search and detail
```

File watching is intentionally deferred. Editors can produce temporary writes,
renames, and multiple save events, so a watcher can invalidate partially written
or invalid content. The first operational step is an explicit publish command.

## Failure Policy

- A failed revalidation call must not modify or delete the Markdown source.
- A `401` means the NAS and Vercel revalidation secrets do not match.
- A `404` means the frontend deployment does not yet contain the Route Handler.
- A `5xx` or timeout requires checking Vercel runtime logs before an operator
  retries the POST. The publication CLI never repeats this administration call.
- If invalidation remains unavailable, normal TTL expiration remains a fallback;
  stale-while-revalidate is not a guaranteed publication deadline.
- Existing local-document fallback and remote API fail-fast policies remain
  unchanged.

## Observability

Successful invalidation writes one Vercel Runtime Log entry containing only the
cache tags and UTC timestamp. Failed authentication never logs a supplied token.

The caller prints fixed status diagnostics, attempt counts and elapsed time, not
document contents or credentials. A successful webhook response does not prove
that the Markdown is valid, so the remote API must be checked before invalidation
during publication.

## 게시 결과 검증 명령

`revalidate:content-cache`는 기대값 JSON을 확인한 뒤 POST 1회와 공개 목록·검색·상세 GET을 수행한다. 기본 모드와 `--verify-only`는 세 응답이 한 순회에서 기대값에 일치해야 성공한다. 제한 횟수·시간 내 미반영은 실패 종료하며, 401/403·429·redirect는 즉시 중단한다. 운영 캐시를 우회하지 않으며 인증 정보는 공개 GET에 전달하지 않는다.

`--invalidate-only`는 캐시 만료만 필요한 기존 용도를 명시하는 예외다. 이 모드의 성공을 발행 결과 검증으로 기록하지 않는다. 기본 호출자는 `DOCS_CONTENT_VERIFY_FILE`을 추가해야 한다. [실행 절차](../runbooks/docs-content-publication-verification.md)와 [로컬 증거](../verification/cache/2026-10-08-content-publication-verifier.md)를 따른다. NAS V1→V2 운영 검증은 아직 남아 있다.

## Future Automation

After the explicit publication flow is stable, evaluate these options in order:

1. Wrap validation and revalidation in one authoring command.
2. Evaluate publication-check backoff after observing operations; administration
   POST retry still requires an explicit safety decision.
3. Warm only the changed canonical route after invalidation.
4. Introduce per-document cache tags if full invalidation becomes expensive.
5. Consider a debounced filesystem watcher only when edits are atomic and
   validation runs before notification.

## 관련 문서

- `docs/architecture/docs-content-rendering-strategy.md`
- `docs/architecture/docs-content-api-fail-fast-policy.md`
- `docs/architecture/docs-content-authoring-pipeline.md`
- `docs/architecture/docs-vercel-platform-operations-policy.md`
- `docs/runbooks/docs-backend-nas-deployment.md`
