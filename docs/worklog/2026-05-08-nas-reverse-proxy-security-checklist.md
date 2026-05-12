# 2026-05-08 NAS Reverse Proxy Security Checklist

## 요약

- NAS 역방향 프록시로 FastAPI/content endpoint를 외부에 공개할 때의 보안 기준을 문서화했다.
- 핵심은 `역방향 프록시 자체`가 위험한 것이 아니라, 공개 경로와 권한 범위를 최소화해야 한다는 점이다.

## 산출물

- runbook 추가:
  - `docs/runbooks/nas-reverse-proxy-security-checklist.md`

## 핵심 포인트

- 외부에는 reverse proxy만 노출
- backend/API 컨테이너는 내부망에만 유지
- HTTPS 강제
- 공개 path 최소화
- `/docs`, `/redoc`, `/openapi.json` 운영 공개 여부 별도 결정
- read path와 write path 분리

## 메모

- 현재 repo 방향성과 가장 잘 맞는 모델은:
  - `apps/docs`: read-only
  - NAS reverse proxy: public HTTPS gateway
  - authoring/publish workflow: write-only
