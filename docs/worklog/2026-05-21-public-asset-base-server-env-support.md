# 2026-05-21 Public Asset Base 서버 env 지원

## Summary

- 공개 asset host용 env로 `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`를 우선 지원하도록 추가했다.
- 기존 `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`는 호환을 위해 fallback으로 유지했다.
- `next.config.mjs`, 원격 콘텐츠 설정 해석, env 문서를 함께 갱신해서 asset host 설정이 기본적으로 서버 지향 구조를 따르도록 정리했다.

## Why

이전 구조는 공개 asset base를 `NEXT_PUBLIC_*` 키에 의존하고 있었는데, 동작은 가능해도 `next.config`나 서버 쪽 콘텐츠 정규화에 꼭 클라이언트 노출형 env가 필요하다는 인상을 줬다.

새 우선순위는 아래와 같다.

1. `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
2. `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
3. `BLOG_CONTENT_ASSET_BASE_URL_INTERNAL`
4. `BLOG_CONTENT_ASSET_BASE_URL`
