# 2026-05-11 Expressive Code Adoption

## Summary

- Removed the remaining direct `shiki` usage path from the docs app.
- Centralized `Expressive Code` options for:
  - light/dark theme pairing
  - manual `.dark` class switching
  - editor/terminal frames with copy buttons
- Applied the same `rehype-expressive-code` configuration to both MDX evaluation paths:
  - `/docs/[...slugParts]`
  - `/category/[main]/[sub]/[slug]`
- Added MDX stylesheet guards so `Expressive Code` blocks are not visually overwritten by the older generic `pre/code` rules.

## Notes

- Local MDX documents now share a single code-block rendering direction.
- Remote HTML content is still a separate path and is not automatically transformed by `Expressive Code`.
- Line numbers were not forced globally in this pass because the more stable next step is to decide whether they should be opt-in via code fence meta or introduced through a dedicated rule.

## Files

- `apps/docs/lib/expressive-code-options.js`
- `apps/docs/next.config.mjs`
- `apps/docs/app/docs/[...slugParts]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/[slug]/page.tsx`
- `apps/docs/app/css/mdx.css`
- `apps/docs/package.json`
