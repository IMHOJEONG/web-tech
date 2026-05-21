# 2026-05-21 Public Asset Base Server Env Support

## Summary

- Added support for `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC` as the preferred public asset host env.
- Kept `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC` as a fallback for compatibility.
- Updated `next.config.mjs`, remote content config resolution, and env documentation so asset host configuration can stay server-oriented by default.

## Why

The previous setup relied on a `NEXT_PUBLIC_*` key for the public asset base, which worked but suggested a client-exposure requirement that was not actually necessary for `next.config` and server-side content normalization.

The new precedence is:

1. `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
2. `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
3. `BLOG_CONTENT_ASSET_BASE_URL_INTERNAL`
4. `BLOG_CONTENT_ASSET_BASE_URL`
