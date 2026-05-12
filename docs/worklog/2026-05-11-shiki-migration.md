# 2026-05-11 Shiki Migration

## Summary

- Dropped the `Expressive Code` path from the docs app and switched local MDX highlighting to the official `@shikijs/rehype` integration.
- Used Shiki dual themes with:
  - `github-light`
  - `poimandres`
- Replaced the previous `data-theme` workaround with the official class-based dark-mode CSS pattern using `html.dark .shiki`.
- Updated both MDX evaluation paths to use the same Shiki rehype plugin so `/docs` detail pages and `/category` detail pages render code blocks consistently.
- Adjusted `mdx-components.tsx` so highlighted block markup from Shiki preserves its classes and token styles.

## Why

`Expressive Code` introduced loader serialization friction in `@next/mdx`, and it was heavier than needed for the current docs scope. Shiki offers a simpler, more direct highlighting path that better fits the current codebase.

## Files

- `apps/docs/lib/shiki-options.js`
- `apps/docs/next.config.mjs`
- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/[slug]/page.tsx`
- `apps/docs/mdx-components.tsx`
- `apps/docs/app/css/mdx.css`
- `apps/docs/package.json`
