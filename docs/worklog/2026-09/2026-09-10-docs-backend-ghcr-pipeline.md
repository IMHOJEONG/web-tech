# Docs Backend GHCR Pipeline

## Goal

`apps/docs-backend` production image를 개발자 PC에만 보관하지 않고, GitHub Actions가 검증 및 게시하고 NAS가 pull하는 배포 경계를 만든다.

## Workflow

`.github/workflows/docs-backend-image.yml`은 다음 정책을 적용한다.

- pull request에서는 NAS architecture와 같은 `linux/amd64` image build만 검증한다.
- `main`의 docs backend 관련 파일이 변경되면 GHCR에 image를 게시한다.
- `workflow_dispatch`로 선택한 Git ref를 수동 게시할 수 있다.
- image tag는 `latest`가 아니라 `sha-<full-git-sha>`만 사용한다.
- GitHub Actions 게시 인증에는 repository-scoped `GITHUB_TOKEN`을 사용한다.
- build cache는 GitHub Actions cache backend에 저장한다.
- image에 SBOM과 build provenance attestation을 생성한다.

## Security Boundary

- workflow에 PAT, NAS 비밀번호, content API token을 저장하지 않는다.
- production image build에 secret build argument를 전달하지 않는다.
- NAS에는 package download만 가능한 `read:packages` token을 별도로 둔다.
- GHCR package visibility는 첫 게시 후 `private`인지 확인한다.
- NAS가 사용하는 image tag는 배포 대상 commit SHA로 고정한다.
- content API token과 registry token은 서로 다른 자격 증명으로 관리한다.

## Deployment Flow

```txt
pull request -> linux/amd64 build verification -> no registry push
main/manual -> linux/amd64 build -> GHCR sha tag push
NAS -> GHCR login with read-only token -> compose pull -> compose up
```

NAS 배포 명령과 secret 파일 구성은 `docs/runbooks/docs-backend-nas-deployment.md`를 기준으로 한다.

## Verification

```bash
pnpm exec prettier --check .github/workflows/docs-backend-image.yml
docker compose \
  --env-file apps/docs-backend/.env.nas.example \
  -f apps/docs-backend/docker-compose.yml \
  config
docker buildx build \
  --platform linux/amd64 \
  --file apps/docs-backend/Dockerfile \
  --tag heap-forge/docs-backend:gha-smoke \
  --load \
  .
docker image inspect \
  heap-forge/docs-backend:gha-smoke \
  --format '{{.Architecture}} {{.Os}} {{.Size}}'
```

검증 결과:

- workflow와 관련 문서의 Prettier 검사 통과
- NAS Compose 해석 결과 `platform: linux/amd64` 확인
- 공유 contract와 NestJS production build를 포함한 Docker build 통과
- 생성 image metadata는 `amd64 linux`, image 크기는 약 `84.8MB`
- 실제 GHCR push는 workflow가 `main`에서 실행되거나 수동 실행된 후 확인한다.
