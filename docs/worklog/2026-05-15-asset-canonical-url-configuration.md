# 2026-05-15 asset canonical URL configuration 정리

## 요약

- 이미지 canonical path는 상대 경로 `/media/*`보다 절대 asset origin이 현재 구조에 더 적합하다고 정리했다.
- 다만 즉시 운영안은 새 서브도메인 발급이 아니라, 기존 공개 도메인 `https://public-content.example.com`을 당분간 canonical처럼 유지하는 쪽으로 잡았다.
- 샘플 env도 즉시 운영안 기준으로 `ASSET_CANONICAL_PREFIX=https://public-content.example.com`으로 맞췄다.

## 이유

- 상대 경로 `/media/*`는 현재 페이지 origin이 받기 때문에, docs 앱 서버와 asset 서버가 분리된 구조에선 혼선이 생길 수 있다.
- 절대 canonical asset URL은 reverse proxy 구성과 캐시 전략을 더 명확하게 만든다.
- 다만 운영 전환은 한 번에 하기보다, 기존 공개 도메인 유지 -> asset 전용 도메인 전환 순서가 더 현실적이다.

## 산출물

- `docs/architecture/docs-content-asset-exposure-strategy.md`
- `docs/examples/remote-content-sidecar/.env.example`
- `docs/examples/remote-content-sidecar/app/config.py`
