# 2026-08-29 Docs Next Proxy Migration

## 배경

Next.js 16부터 `middleware.ts` 파일 convention과 `middleware` named export는 `proxy.ts`와 `proxy` export로 rename되었다.

HeapForge docs 앱은 request blocklist를 Next request boundary에서 처리하고 있었기 때문에, 기능 의미는 그대로 유지하되 파일 convention만 현재 Next.js 문법에 맞췄다.

## 적용 내용

- `apps/docs/middleware.ts`를 `apps/docs/proxy.ts`로 rename했다.
- exported function 이름을 `middleware`에서 `proxy`로 변경했다.
- request blocklist 문서와 SEO metadata route 문서의 연결 위치를 `proxy.ts` 기준으로 갱신했다.

## 정책

- Proxy에서는 느린 데이터 fetch를 하지 않는다.
- Proxy는 suspicious request를 빠르게 차단하는 request boundary로만 사용한다.
- 차단 판단은 `apps/docs/lib/request-blocklist.ts`에 유지하고, Proxy 파일은 얇은 연결 레이어로 둔다.

## 검증 예정

- `pnpm --filter docs test:lib`
- `pnpm --filter docs lint`
- `pnpm --filter docs typecheck`
