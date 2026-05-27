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
- `apps/vuln-radar-backend`를 service root로 잡으면 `packages/*`를 볼 수 없어서 build가 실패한다.
  - `failed to calculate checksum ... "/packages/tailwind-config": not found`
    유형의 에러는 거의 이 문제다.
  - Railway에서는 repo root를 build context로 두고, Dockerfile path만 `apps/vuln-radar-backend/Dockerfile`로 지정해야 한다.
- backend의 env 로딩은 `.env` 파일 필수가 아니라 “있으면 읽고, 없으면 무시”로 바꿨다.
  - 따라서 Railway에서는 `.env` 파일을 만들 필요 없이 Variables만 설정하면 된다.
- `prisma generate`는 DB 접속 명령이 아닌데도 `prisma.config.ts`를 먼저 로드한다.
  - 기존에는 `resolveDirectDatabaseUrl()`가 `DATABASE_URL`/`DIRECT_URL` 부재 시 즉시 throw해서 build가 실패했다.
  - 현재는 `prisma.config.ts`에서만 fallback URL을 허용하도록 분리해서 generate/build 단계는 통과하게 정리했다.
