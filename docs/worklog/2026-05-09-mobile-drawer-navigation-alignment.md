# 2026-05-09 Mobile Drawer Navigation Alignment

## Summary

- Aligned the mobile drawer primary navigation with the desktop primary navigation.
- Removed `/docs` from the drawer's first-level list because `/docs` is an index/search context, not a primary user-facing destination.
- Added the missing `Mobile` entry back into the drawer.
- Stopped using alternate drawer-only labels such as `Latest Articles` or `Tutorials`, and reused the same `navigation` copy as desktop.

## Why

The previous drawer structure created an IA mismatch:

- desktop primary nav: `Feed / Web / Mobile / UI/UX / About`
- mobile drawer primary nav: `Feed / Web / UI/UX / Docs / About`

That made mobile navigation feel like a different product model. The updated drawer now matches the main navigation policy more closely.
