# Docs Content Style Warning Cleanup

Date: 2026-08-29

## Context

`pnpm --filter docs build`에서 콘텐츠 스타일 경고가 2개 발생했다.

- `apps/docs/category/fe/react/nextjs.mdx`: `published` 상태인데 본문이 비어 있음
- `apps/docs/category/fe/react/test.mdx`: `slug: test`가 placeholder slug로 판단됨

## Decision

발행 상태의 문서는 최소한 하나 이상의 본문 heading과 설명을 가져야 한다.

테스트용 또는 임시 slug는 canonical route에도 그대로 노출되므로 발행 문서에는 사용하지 않는다.

## Changes

- `nextjs.mdx`에 Next.js 패키지 내부 구조를 읽는 목적과 확인 기준을 추가했다.
- ARIA 글의 slug를 `drawer-aria-focus-management`로 변경했다.

## Verification

- `pnpm --filter docs validate:content`
- `pnpm --filter docs build`
