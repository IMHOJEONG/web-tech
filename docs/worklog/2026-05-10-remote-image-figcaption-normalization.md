# 2026-05-10 Remote Image Figcaption Normalization

## Summary

- Added a remote HTML normalization step that upgrades `<p><img ...><em>caption</em></p>` into semantic `figure/figcaption` markup.
- This keeps markdown-authored image captions readable without requiring backend-side HTML post-processing.
- Added matching `figure` and `figcaption` styles to the docs MDX stylesheet.

## Files

- `apps/docs/lib/content-api-html.ts`
- `apps/docs/app/css/mdx.css`
