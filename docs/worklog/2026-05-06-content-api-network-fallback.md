# 2026-05-06 Content API Network Fallback

## Summary

- `fetch failed`가 네트워크 위치 변경 때문에 발생할 가능성을 고려해, `docs` remote content fetch를 단일 base URL 고정 구조에서 fallback 후보군 구조로 확장했다.
- 자동 네트워크 감지보다는 `명시적 후보군 순차 시도` 방식을 선택했다.

## Why

- 현재 remote content fetch는 서버에서 실행된다.
- 따라서 브라우저가 어느 네트워크에 있는지보다, `실행 중인 서버/개발 머신이 어떤 endpoint에 도달 가능한지`가 더 중요하다.
- 이 상황에서 클라이언트 위치를 억지로 추론하기보다:
  - internal 후보
  - public 후보
  - 기타 fallback 후보
    를 순서대로 시도하는 편이 더 단순하고 운영 리스크가 낮다.

## Changes

- `apps/docs/lib/content-api.ts`
  - `BLOG_CONTENT_API_BASE_URLS`
  - `BLOG_CONTENT_MARKDOWN_BASE_URLS`
  - `BLOG_CONTENT_API_BASE_URL_INTERNAL`
  - `BLOG_CONTENT_API_BASE_URL_PUBLIC`
  - `BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL`
  - `BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC`
    지원 추가
  - 후보군을 순서대로 시도하고, 성공한 첫 번째 config 사용
- `apps/docs/.env.example`
  - 새 env placeholder 추가
- `turbo.json`
  - 새 env 키 선언
- `docs/runbooks/docs-env-checklist.md`
  - fallback 운영 규칙 보강
- `docs/architecture/blog-content-api-contract.md`
  - endpoint selection 섹션 추가

## Recommendation

- 로컬 개발 환경에서 네트워크 위치가 자주 바뀌면 `*_BASE_URLS` 또는 `*_INTERNAL` / `*_PUBLIC`을 우선 사용한다.
- Vercel 같은 고정 배포 환경은 단일 public URL만 써도 충분하다.
