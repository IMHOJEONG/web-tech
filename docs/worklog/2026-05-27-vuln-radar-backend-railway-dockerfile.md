# 2026-05-27 vuln-radar-backend Railway Dockerfile 추가

## 작업 내용

- `apps/vuln-radar-backend`에 Railway 배포용 Dockerfile을 추가했다.
- 모노레포 구조를 고려해서 workspace root를 build context로 사용하고, `pnpm filter` 기반으로 backend에 필요한 의존성만 설치하도록 구성했다.
- 최종 이미지에는 `pnpm deploy --prod` 결과만 복사하도록 해서 runtime 이미지를 단순화했다.

## Dockerfile 기준

- base image: `node:22-bookworm-slim`
- package manager: `corepack + pnpm`
- build stage
  - `pnpm install --filter vuln-radar-backend... --frozen-lockfile`
  - `pnpm --filter vuln-radar-backend build`
  - `pnpm --filter vuln-radar-backend deploy --prod /prod/vuln-radar-backend`
- runtime stage
  - `/prod/vuln-radar-backend`만 복사
  - `node dist/main`으로 실행

## 메모

- Railway는 `PORT` env를 주입하므로, backend는 기존처럼 `PORT`를 읽으면 된다.
- 이 Dockerfile은 workspace root 기준 파일들을 참조하므로, 배포 서비스 설정에서도 build context를 repo root로 잡는 전제가 있다.
