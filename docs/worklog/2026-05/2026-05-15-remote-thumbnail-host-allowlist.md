# 2026-05-15 Remote Thumbnail Host Allowlist

## 변경 내용

- `next/image`가 원격 썸네일을 정상적으로 읽을 수 있도록 `next.config.mjs`에
  remote image allowlist를 추가했다.
- 허용 대상은 다음 env를 기준으로 자동 수집한다.
  - `NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC`
  - `BLOG_CONTENT_ASSET_BASE_URL*`
  - `BLOG_CONTENT_MARKDOWN_BASE_URL*`
  - `BLOG_CONTENT_API_BASE_URL*`

## 이유

- backend가 원격 썸네일 절대 URL을 내려줘도, `next/image`가 해당 호스트를
  허용하지 않으면 런타임 이미지 로드 오류가 발생한다.
- 썸네일과 본문 이미지가 같은 content host를 쓰는 구조라면, frontend도 그 host를
  이미지 source로 인식할 수 있어야 한다.

## 판단

- 장기적으로는 backend가 썸네일 absolute URL을 내려주는 편이 가장 명확하다.
- frontend는 fallback 해석을 유지하되, 원격 host allowlist는 env 기반으로 자동
  맞추는 편이 운영상 안전하다.
