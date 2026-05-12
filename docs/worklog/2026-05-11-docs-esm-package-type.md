# 2026-05-11 Docs ESM Package Type

## Summary

- Added `"type": "module"` to `apps/docs/package.json`.
- This removes the `MODULE_TYPELESS_PACKAGE_JSON` warning when `next.config.mjs` imports `lib/expressive-code-options.js`.
- The change is scoped to the `docs` app package so the `.js` helper file is consistently treated as ESM.

## Files

- `apps/docs/package.json`
