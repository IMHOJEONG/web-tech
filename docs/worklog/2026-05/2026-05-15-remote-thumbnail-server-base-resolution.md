# 2026-05-15 Remote Thumbnail Server Base Resolution

## 변경 내용

- 원격 콘텐츠 메타의 `thumbnail`이 절대 URL이 아닐 때도 서버 기준으로 해석되도록 정리했다.
- `docs` 앱에 `BLOG_CONTENT_ASSET_BASE_URL` 설정을 추가했다.
- 값이 없으면 `BLOG_CONTENT_MARKDOWN_BASE_URL`, 그다음 `BLOG_CONTENT_API_BASE_URL`
  순서로 fallback 하도록 구성했다.

## 적용 기준

- 절대 URL
  - 그대로 사용
- 상대 경로
  - 예: `shadcn/thumbnail.webp`
  - 예: `ui-ux/blocked-aria-hidden/hero.webp`
  - remote asset base URL과 결합해 절대 URL로 사용

## 이유

- 원격 본문은 이미 서버에서 내려오는데, 썸네일만 frontend `public` 기준으로
  해석되면 콘텐츠 출처가 서로 어긋난다.
- remote 메타의 썸네일도 본문과 같은 content source 기준으로 읽히는 편이
  더 자연스럽다.
