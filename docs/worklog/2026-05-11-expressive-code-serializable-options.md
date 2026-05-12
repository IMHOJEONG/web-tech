# 2026-05-11 Expressive Code Serializable Options

## Summary

- Removed the non-serializable function-valued `themeCssSelector` option from the shared Expressive Code config.
- Kept the config as a plain JavaScript object so `@next/mdx` can serialize it safely.
- Updated the docs theme toggle flow to maintain both:
  - `html.dark`
  - `html[data-theme]`
- Switched the `next.config.mjs` MDX plugin declaration to the string form of `rehype-expressive-code` so the MDX loader does not receive a live function reference during option serialization.

This keeps the site theme switcher aligned with Expressive Code's theme selection model without passing functions into the MDX loader options.

## Files

- `apps/docs/lib/expressive-code-options.js`
- `apps/docs/feature/theme-toggle/theme.store.ts`
- `apps/docs/app/layout.tsx`
