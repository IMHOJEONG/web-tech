# 2026-05-27 vuln-radar 프론트/백엔드 인증 연동 정리

## 작업 내용

- `vuln-radar-backend`의 데이터 endpoint 보호에 맞춰 `apps/vuln-radar`의 proxy 설정을 정리했다.
- 브라우저 코드에는 secret을 넣지 않고, `Vite server.proxy`가 `Authorization` 헤더를 upstream에 주입하도록 변경했다.
- `apps/vuln-radar/.env.example`에 `VULN_RADAR_BACKEND_API_TOKEN` 예시를 추가했다.
- 관련 README, 개발 런타임 문서, infra 지식 문서를 함께 업데이트했다.

## 구현 기준

- 브라우저는 계속 `/api/backend/*`만 호출한다.
- 실제 backend origin과 `Authorization` 헤더는 Vite dev server 또는 운영 reverse proxy가 처리한다.
- `VULN_RADAR_BACKEND_API_TOKEN`은 `VITE_*` public env가 아니라 server-side env로만 사용한다.

## 이유

- `vuln-radar`는 브라우저 앱이라서 shared-secret을 클라이언트 번들에 넣으면 보안상 의미가 없다.
- 따라서 frontend-to-backend 보호는 “브라우저 secret 보관”이 아니라 “proxy header injection”으로 풀어야 한다.

## 후속 메모

- 운영 배포에서도 같은 원칙을 유지해야 한다.
- 즉, production 환경에서도 `apps/vuln-radar` 앞단의 reverse proxy나 gateway가 backend로 보낼 때 `Authorization` 헤더를 주입하도록 구성해야 한다.
