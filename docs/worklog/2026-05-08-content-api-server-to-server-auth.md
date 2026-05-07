# 2026-05-08 Content API Server-to-Server Auth

## Summary

- `apps/docs` 원격 콘텐츠 fetch에 `server-to-server` Bearer 토큰 모델을 적용했다.
- 구현은 `fetch` 대신 기존 의존성인 `ky` 기준으로 맞췄다.

## Why

- `docs` 앱 서버는 외부에 배포되어 있다.
- 콘텐츠 source endpoint는 브라우저 직접 접근으로 열어두고 싶지 않다.
- 따라서 내부망 전용 접근보다 `앱 서버만 통과할 수 있는 인증`이 더 적합하다.

## Applied

- `apps/docs/lib/content-api.ts`
  - `BLOG_CONTENT_API_TOKEN`을 읽어 `Authorization: Bearer <token>` 헤더를 구성
  - 목록 API, 본문 API 모두 `ky.get()`으로 호출
- `apps/docs/.env.example`
  - `BLOG_CONTENT_API_TOKEN` placeholder 추가
- `turbo.json`
  - `BLOG_CONTENT_API_TOKEN`을 `globalEnv`에 추가
- 문서 갱신
  - `docs/architecture/blog-content-api-contract.md`
  - `docs/runbooks/docs-env-checklist.md`
  - `docs/runbooks/nas-reverse-proxy-security-checklist.md`

## Decision

- `apps/docs`는 read-only consumer
- 콘텐츠 endpoint는 public host/path로 열 수 있어도, 토큰 없이는 `401/403`
- raw content URL 직접 입력은 실패하고, `docs` 서버 fetch만 통과하는 모델을 기본값으로 본다
