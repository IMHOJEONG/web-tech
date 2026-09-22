# 2026-05-26 Content API 인증/장애 대응 기준 확정

## 요약

- `docs` remote content 인증/장애 대응 운영 기준을 기준 문서 중심으로 다시 정리하고, TODO를 완료 처리했다.
- 기존 runbook에 이미 있던 결정을 “확정된 운영 기준”으로 보이게 재구성했다.

## 반영 문서

- `docs/runbooks/content-api-auth-ops-runbook.md`
- `docs/knowledge/content-platform/README.md`
- `docs/todo/todo.md`

## 이번에 명시적으로 확정한 기준

- `BLOG_CONTENT_API_TOKEN` / `CONTENT_API_TOKEN`의 교체 주기와 회전 절차
- `401/403`은 인증 실패로 보고 즉시 중단
- 향후 다중 endpoint 정책이 다시 필요해져도 network 계열 오류에서만 다음 후보 시도
- NAS reverse proxy의 `Authorization` 헤더 전달 검증 절차
- 프론트/백엔드/프록시 점검 순서
- 홈 `/`는 section-level graceful degradation, 문서 상세는 에러 페이지로 보내는 정책

## 메모

- 이번 작업은 새로운 구조를 만들기보다, 이미 누적된 결정을 하나의 운영 기준으로 묶는 성격이 강했다.
- 이후 원격 콘텐츠 정책이 바뀌면, 가장 먼저 이 runbook과 `docs/knowledge/content-platform/README.md`를 함께 갱신하는 것이 좋다.
