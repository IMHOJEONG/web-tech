# 2026-05-18 Public Asset Base Env Rename

## 변경 내용

- public remote thumbnail asset base env 이름을
  `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`로 변경했다.
- `docs` 앱의 server-side config와 `next.config.mjs`도 새 이름을 읽도록 수정했다.

## 이유

- public asset host라는 의도가 변수명에서 더 직접적으로 드러나게 하려는 목적이다.
- `next.config.mjs`와 image allowlist 설정에서도 같은 이름을 그대로 재사용하기 쉽게 맞췄다.
