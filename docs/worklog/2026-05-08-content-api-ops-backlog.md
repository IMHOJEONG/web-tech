# 2026-05-08 Content API Ops Backlog

## 요약

- 최근 remote content 인증/프록시 이슈를 기준으로 운영 백로그를 별도 항목으로 정리했다.
- 단순 구현 이슈가 아니라 `token 운영`, `fallback 정책`, `reverse proxy header 전달`, `env 반영 점검`이 함께 묶여야 한다고 판단했다.

## 추가한 초점

- shared token 회전 주기와 교체 절차
- `401/403` 즉시 중단 정책
- 향후 다중 endpoint 복귀 시에도 `timeout`, `ENOTFOUND` 같은 네트워크 오류에서만 다음 후보 시도
- NAS reverse proxy의 `Authorization` 헤더 전달 확인 절차
- `docs` 서버 / backend / 배포 env의 불일치 진단 순서
- 홈 landing과 상세 페이지의 서로 다른 장애 대응 정책 명시

## 백로그 참고 문서

- `docs/todo/platform-improvement-todo.md`
- `docs/runbooks/content-api-auth-ops-runbook.md`
