# Overview Freshness Copy And Cadence

## Summary

- Renamed the awkward Korean section title from `수집 최신성` to `데이터 반영 상태`.
- Extracted the overview polling interval into a shared constant so the screen and the query configuration use the same source of truth.
- Added a visible refresh cadence row to the overview panel to show how often the dashboard re-checks the backend.

## Current Behavior

- Overview dashboard queries refetch every `60초`.
- The panel now exposes that cadence explicitly instead of only showing timestamps.

## Files

- `src/pages/overview/ui/overview-page.tsx`
- `src/shared/i18n/messages.ts`
