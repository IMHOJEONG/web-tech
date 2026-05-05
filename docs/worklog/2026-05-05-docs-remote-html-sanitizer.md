# Worklog: 2026-05-05 Docs Remote HTML Sanitizer

## Summary

- `jsdom` 기반 remote HTML sanitize 로직을 `sanitize-html` 기반으로 교체
- 검색 경로(`/docs?q=...`)에서 `content-api`를 통해 `jsdom`이 로드되던 문제 제거
- `apps/docs` 의존성에서 `jsdom` 제거, `sanitize-html`과 타입 패키지 추가

## Changed

- `apps/docs/lib/content-api.ts`
- `apps/docs/package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `docs/worklog/2026-05-05-docs-remote-html-sanitizer.md`

## Notes

- 기존 구조는 `content-api.ts`의 top-level `jsdom` import 때문에 검색처럼 메타데이터만 필요한 경로에서도 `jsdom` 의존성 트리가 함께 로드됐다.
- Vercel 런타임에서 `html-encoding-sniffer`와 `@exodus/bytes` 사이의 CommonJS/ESM 충돌이 발생해 `/docs?q=...` 요청이 실패했다.
- `sanitize-html`로 교체하면서 이 import 체인을 제거했고, HTML allowlist 기반 sanitize 정책으로 단순화했다.
