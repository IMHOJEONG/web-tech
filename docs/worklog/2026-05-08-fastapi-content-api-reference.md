# 2026-05-08 FastAPI Content API Reference

## 요약

- `FastAPI` 기반 원격 콘텐츠 서버의 최소 운영 예시를 문서로 정리했다.
- `requirements.txt`, `docker-compose.yml`, `Dockerfile`, `posts/` 폴더 구조, `main.py` 예시, `curl` 검증 명령을 한 문서에 모았다.
- 추가로 `slug`, `id`, `markdownPath` 역할과 `/docs/{channel}/{articleSlug}` 공개 URL 규칙을 문서에 명시했다.

## 이유

- 현재 `apps/docs`는 `markdownPath`가 `web/test`, `ui-ux/blocked-aria-hidden`처럼 채널 하위 경로를 가질 수 있는 구조로 가고 있다.
- 따라서 콘텐츠 서버도 단일 파일명이 아니라 nested path와 frontmatter 메타를 읽는 예시가 필요했다.

## 산출물

- `docs/runbooks/fastapi-content-api-reference.md`
