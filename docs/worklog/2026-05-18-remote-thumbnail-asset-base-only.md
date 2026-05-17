# 2026-05-18 Remote Thumbnail Asset Base Only

## 변경 내용

- 원격 메타의 상대 썸네일 경로는 `BLOG_CONTENT_ASSET_BASE_URL*`로만 해석되도록 정리했다.
- 더 이상 `BLOG_CONTENT_MARKDOWN_BASE_URL*`나 `BLOG_CONTENT_API_BASE_URL*`로 썸네일
  경로를 fallback 하지 않는다.
- `turbo.json`에도 asset base env 키를 전체 변형 기준으로 추가했다.

## 이유

- 본문 HTML host와 썸네일 asset host가 분리되는 운영 구조에서는,
  썸네일만 별도 asset origin을 쓰는 것이 더 일반적이다.
- fallback이 남아 있으면 “상대 썸네일이 어느 host로 풀리는지”가 모호해질 수 있다.

## 기준

- 절대 `thumbnail` URL
  - 그대로 사용
- 상대 `thumbnail` 경로
  - `BLOG_CONTENT_ASSET_BASE_URL*`와 결합
  - 값이 없으면 frontend 상대 경로로 남고, remote host fallback은 하지 않음
