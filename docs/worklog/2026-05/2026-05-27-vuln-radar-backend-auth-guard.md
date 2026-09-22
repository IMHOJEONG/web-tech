# 2026-05-27 vuln-radar-backend 인증 가드 적용

## 작업 내용

- `vuln-radar-backend`의 데이터 응답 엔드포인트에 shared-secret 기반 인증 가드를 적용했다.
- `feeds`와 `ingest` 컨트롤러에는 `Authorization: Bearer <token>`이 없으면 데이터를 내려주지 않도록 변경했다.
- `health` 엔드포인트는 기존처럼 공개 상태를 유지했다.
- 서버 env 예시에 `VULN_RADAR_API_TOKEN`을 추가했다.

## 구현 기준

- 인증은 `Authorization` 헤더의 `Bearer` 토큰으로 검증한다.
- 서버에 `VULN_RADAR_API_TOKEN`이 설정되지 않은 경우에도 데이터 엔드포인트는 기본 차단한다.
- 토큰 불일치, 헤더 누락, 잘못된 스킴은 모두 `401 Unauthorized`로 응답한다.
- 토큰 비교는 `timingSafeEqual`로 처리했다.

## 검증

- `pnpm --filter vuln-radar-backend typecheck`
  - 통과
- `pnpm --filter vuln-radar-backend test -- --runInBand shared/guards/backend-auth.guard.spec.ts`
  - 통과
- `pnpm --filter vuln-radar-backend test:e2e`
  - 현재 실행 환경에서는 `supertest`가 포트를 여는 단계에서 `EPERM`으로 실패
  - 인증 로직 자체는 가드 단위 테스트로 확인

## 메모

- 이번 작업은 “데이터를 반환하는 endpoint는 기본적으로 닫고, health/status만 공개한다”는 backend 운영 기준을 `vuln-radar-backend`에도 적용한 사례다.
