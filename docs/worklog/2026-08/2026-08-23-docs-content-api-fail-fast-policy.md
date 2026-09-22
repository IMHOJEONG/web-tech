# 2026-08-23 Docs Content API Fail-Fast Policy

## 배경

원격 content API가 530 또는 지연 상태일 때, Vercel runtime timeout 전에 빠르게 실패로 판정하고 로컬 문서 렌더링으로 넘어가는 기준을 공유 문서로 정리할 필요가 있었다.

## 변경

- `docs/architecture/docs-content-api-fail-fast-policy.md`를 추가했다.
- `docs/runbooks/content-api-auth-ops-runbook.md`에서 fail-fast 기준 문서로 연결했다.

## 핵심 내용

- fail-fast는 원격 장애를 숨기는 정책이 아니다.
- 원격 API를 오래 기다리다 사이트 전체가 timeout되는 것을 막는 정책이다.
- 현재 기본 timeout은 `BLOG_CONTENT_API_TIMEOUT_MS=2500`이다.
- 로컬 문서가 있는 상세 route는 원격 요청보다 로컬 문서를 먼저 사용한다.
- 목록/검색은 원격 실패 시 로컬 문서만으로 렌더링한다.
