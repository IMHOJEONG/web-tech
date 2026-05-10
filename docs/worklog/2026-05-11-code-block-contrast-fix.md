# 2026-05-11 Code Block Contrast Fix

## Summary

- Fixed code block contrast in the docs app by correcting the foreground token used on dark code surfaces.
- `var(--inverse-surface)` had been used as text color on `var(--hf-bg-deep)`, which caused near-black text on near-black backgrounds in light mode.
- Switched code surfaces to `var(--inverse-on-surface)` for readable contrast.

## Files

- `apps/docs/app/css/mdx.css`
- `packages/tailwind-config/shared-styles.css`
