# 2026-05-15 posts/assets naming policy 정리

## 요약

- `posts`는 `channel/slug.md` 형태로 평탄화하고, `assets`만 `channel/slug/...` 폴더 구조로 관리하는 기준을 문서에 추가했다.
- `feed/pna/pna.md` 같은 중첩 구조보다 `feed/pna.md`를 권장하기로 했다.
- markdown 파일 이름은 leaf slug가 되므로, 소문자 kebab-case 규칙을 같이 고정했다.

## 이유

- `posts` 경로는 그대로 `markdownPath`, `slug`, 공개 URL 계약으로 이어지는 편이 더 단순하다.
- `assets`는 문서 하나에 여러 이미지가 연결될 수 있으므로 slug 폴더 구조가 더 자연스럽다.

## 산출물

- `docs/runbooks/fastapi-content-api-reference.md`
- `docs/architecture/docs-content-authoring-pipeline.md`
