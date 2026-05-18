## 개발 런타임 전략

이 문서는 `apps/vuln-radar`와 `apps/vuln-radar-backend`를 로컬에서 어떻게 함께 띄우는지 정리한다.

## 기본 원칙

두 앱은 `workspace dependency`로 묶지 않는다.

- frontend는 별도 프로세스
- backend는 별도 프로세스
- 연결은 `env + proxy`로 처리

이유:

- backend는 라이브러리가 아니라 런타임 서비스다.
- persistent dev task를 Turbo `dependsOn`으로 강하게 묶으면 운영이 꼬이기 쉽다.
- 이후 Vite 전환 시에도 같은 접근을 유지하기 쉽다.

## 권장 실행 방식

루트 기준:

```bash
pnpm dev:vuln-radar
pnpm dev:vuln-radar-backend
pnpm dev:vuln-radar:full
pnpm check:vuln-radar:dev
```

권장 기본값:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`

`pnpm check:vuln-radar:dev`는 아래 세 가지를 순서대로 확인한다.

- `http://localhost:4000/api/health`
- `http://localhost:3000/api/backend/health`
- `http://localhost:3000`

## 공개 경로 규칙

전환기에는 경로를 두 종류로 나눈다.

- backend route: `/api/backend/*`

이 규칙을 두면 기존 `app/api`를 당장 다 지우지 않아도 되고, 새 backend API는 별도 경로로 붙일 수 있다.
지금은 legacy `app/api`가 제거된 상태라, 새 backend API는 `/api/backend/*` 경로를 기준으로 붙이면 된다.

## 현재 기본값: Vite `server.proxy`

현재 `apps/vuln-radar`는 Vite를 쓰므로 가장 가벼운 선택은 `vite.config.ts`의 `server.proxy`다.

예시:

```text
/api/backend/health
-> http://localhost:4000/api/health
```

이 방식의 장점:

- 별도 로컬 게이트웨이가 필요 없다.
- 브라우저에서 CORS를 거의 신경 쓰지 않아도 된다.
- repo 안 설정만으로 끝난다.
- 이후 Vite의 `server.proxy`로 같은 패턴을 유지하기 쉽다.

이 방식의 한계:

- Vite 개발 서버 안에서만 의미가 있다.
- HTTPS, 고정 origin, 여러 서비스 게이트웨이 요구에는 약하다.

## `Caddyfile` vs proxy

### proxy를 기본값으로 추천하는 이유

- 설정이 가볍다.
- 앱 repo 안에서 끝난다.
- 프론트 개발 속도가 빠르다.
- 지금 단계에서는 충분하다.

추천 상황:

- 로컬 프론트 + 로컬 백엔드 연결
- CORS 회피
- Vite 전환 고려
- 개발자 개인 환경

### Caddyfile이 더 나은 상황

`Caddy`는 로컬 reverse proxy 또는 gateway가 필요할 때 유리하다.

추천 상황:

- 로컬 HTTPS가 꼭 필요함
- 여러 앱을 한 origin 아래 묶고 싶음
- secure cookie / callback / redirect 테스트가 필요함
- frontend, backend, docs를 한 도메인처럼 다루고 싶음
- 브라우저나 외부 툴에서 고정 origin이 중요함

단점:

- 설정과 운영 포인트가 더 늘어난다.
- 간단한 로컬 개발에는 과하다.
- 팀원마다 로컬 게이트웨이 구성이 달라질 수 있다.

## 현재 추천 결론

지금 단계에서는 이렇게 가는 걸 추천한다.

1. 기본 개발은 `Vite dev server + server.proxy`
2. 기본 proxy는 `server.proxy`
3. `Caddyfile`은 HTTPS / gateway 요구가 생길 때만 사용

즉, `Vite proxy first, Caddy optional`이 현재 repo에 가장 잘 맞는다.

## 관련 트러블슈팅

- `docs/004_workspace_install_and_typescript_recovery.md`
  - `@web-tech/ui prebuild` 실패
  - `@web-tech/typescript-config/react-library` 미해석
  - React/Vite/JSX 타입 동시 붕괴
  - `pnpm install` 기반 복구 순서
