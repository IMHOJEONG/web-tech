# 2026-09-11 Docs Vercel Platform Operations Policy

## Goal

Define which Vercel platform controls should protect and observe `apps/docs`
without adding unnecessary paid infrastructure.

## Applied

- Documented the exact WAF rate-limit rule for the content revalidation endpoint.
- Added Sensitive Environment Variable and Preview Deployment Protection guidance.
- Defined Runtime Logs, Firewall traffic and alert checks.
- Recorded Speed Insights and Seoul Function region as measure-first candidates.
- Added Instant Rollback and Attack Challenge Mode incident guidance.
- Deferred Log Drains, Spend Management and Rolling Releases until scale or plan
  requirements justify their operational cost.

## Boundary

This change documents repository policy and dashboard procedures. It does not
claim that a Vercel dashboard-only setting is active until an operator applies
and verifies it.

## Follow-up

1. Apply and verify the Production revalidation rate limit.
2. Re-create the two content tokens as Sensitive variables where needed.
3. Enable Preview-only Vercel Authentication.
4. Subscribe to Function failure and unusual usage alerts.
5. Evaluate Speed Insights before changing Function region.
