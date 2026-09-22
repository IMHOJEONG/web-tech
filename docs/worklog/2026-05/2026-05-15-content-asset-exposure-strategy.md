# 2026-05-15 content asset exposure strategy 정리

## 요약

- 블로그 본문 이미지에서 원본 NAS/스토리지 주소가 직접 보이는 문제를 별도 설계 주제로 정리했다.
- 결론은 “URL을 완전히 숨긴다”가 아니라, “원본 저장소 주소 대신 canonical asset URL만 노출한다”에 가깝다.
- 현재 구조에서는 `content/assets/...`에 저장하고, 외부 노출은 `/media/...` 또는 `assets.example.com/...` 같은 프록시 경로로 통일하는 쪽을 권장하기로 했다.

## 이유

- 스토리지 실주소와 포트 노출을 줄일 수 있다.
- public URL 계약을 스토리지 위치와 분리할 수 있다.
- NAS reverse proxy 또는 assets 도메인 프록시가 현재 구조와 가장 잘 맞는다.

## 산출물

- `docs/architecture/docs-content-asset-exposure-strategy.md`
- `docs/examples/remote-content-sidecar/app/assets.py`
