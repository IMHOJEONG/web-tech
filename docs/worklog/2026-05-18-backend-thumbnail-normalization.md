# 2026-05-18 Backend Thumbnail Normalization

## 변경 내용

- remote content sidecar 예제에서 `build_post_meta()`가 썸네일을 절대 URL로
  정규화해서 내려주도록 바꿨다.
- 상대 `thumbnail` 경로는 `ASSET_CANONICAL_PREFIX`와 결합하고,
  이미 절대 URL이면 그대로 유지하도록 구성했다.

## 이유

- frontend가 상대 썸네일 경로를 다시 조합하면, 배포 env나 image host allowlist에
  따라 로드 문제가 생기기 쉽다.
- backend가 list API 단계에서 absolute thumbnail URL을 내려주면 책임이 더
  명확해지고 frontend는 그 값을 그대로 사용하면 된다.

## 산출물

- `docs/examples/remote-content-sidecar/app/content.py`
- `docs/runbooks/fastapi-content-api-reference.md`
- `docs/architecture/docs-content-asset-exposure-strategy.md`
