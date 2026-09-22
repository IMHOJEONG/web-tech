# Docs Backend NAS Deployment

## Purpose

`apps/docs-backend` NestJS API를 NAS 내부 Docker 컨테이너로 배포하고, 외부의 `apps/docs` 서버만 HTTPS reverse proxy를 통해 읽도록 구성한다.

## Network Model

```txt
apps/docs server
  -> HTTPS api.heap-forge.app
  -> NAS reverse proxy
  -> 127.0.0.1:8000
  -> docs-backend container:8000
  -> read-only content volume
```

핵심 원칙:

- container port `8000`을 NAS 공인 IP에 직접 bind하지 않는다.
- 외부 TLS는 NAS reverse proxy에서 종료한다.
- reverse proxy는 `GET /api/posts`, `GET /posts/*`만 전달한다.
- 모든 content endpoint는 Bearer token을 요구한다.
- `/health`는 NAS 내부 점검에만 사용한다.
- publish/upload 경로는 이 read API에 추가하지 않는다.

## Files

- Compose: `apps/docs-backend/docker-compose.yml`
- NAS environment template: `apps/docs-backend/.env.nas.example`
- token secret: `apps/docs-backend/secrets/content_api_token`
- Markdown source: `apps/docs-backend/content/posts`

## Initial Setup

저장소 루트에서 실행한다.

```bash
cp apps/docs-backend/.env.nas.example apps/docs-backend/.env.nas
mkdir -p apps/docs-backend/secrets
openssl rand -hex 32 > apps/docs-backend/secrets/content_api_token
chmod 600 apps/docs-backend/secrets/content_api_token
```

`.env.nas`에서 NAS 경로를 지정한다.

```dotenv
DOCS_BACKEND_IMAGE=ghcr.io/imhojeong/web-tech-docs-backend:sha-replace-with-git-sha
DOCS_BACKEND_BIND_ADDRESS=127.0.0.1
DOCS_BACKEND_PORT=8000
DOCS_CONTENT_PATH=/volume1/docker/heap-forge/content/posts
DOCS_CONTENT_TOKEN_FILE=/volume1/docker/heap-forge/secrets/content_api_token
CONTENT_ASSET_BASE_URL=https://assets.heap-forge.app
```

`DOCS_CONTENT_PATH`는 NAS에 존재하는 디렉터리이며 컨테이너에는 read-only로 mount된다. 이미지 파일은 이 API가 직접 제공하지 않으므로 `CONTENT_ASSET_BASE_URL`의 별도 정적 asset origin에 배포해야 한다.

## Vercel Content Cache Revalidation

NAS의 Markdown 변경은 `docs-backend` API 응답에는 즉시 반영되지만,
`apps/docs`는 기본 300초 동안 원격 응답을 캐시한다. 발행 직후 반영하려면
Vercel과 NAS에 별도의 revalidation token을 설정한다.

Vercel의 `apps/docs` 환경변수:

```env
BLOG_CONTENT_REVALIDATE_SECONDS=300
BLOG_CONTENT_REVALIDATE_TOKEN=<dedicated-random-token>
```

이 값은 `BLOG_CONTENT_API_TOKEN`과 분리한다. Vercel 환경변수를 추가하거나
변경한 뒤에는 새 deployment를 생성한다.

NAS에는 같은 revalidation token을 Git 저장소 밖의 파일로 저장한다.

```bash
sudo install -d -m 700 /volume1/docker/heap-forge/secrets
sudo sh -c 'umask 077; cat > /volume1/docker/heap-forge/secrets/docs_revalidation_token'
```

토큰을 입력하고 `Ctrl+D`로 종료한다. 문서와 frontmatter를 검증한 다음
code-server 또는 NAS checkout에서 캐시 무효화 명령을 실행한다.

```bash
DOCS_CONTENT_REVALIDATE_URL=https://heap-forge.app/api/revalidate/content \
DOCS_CONTENT_REVALIDATE_TOKEN_FILE=/volume1/docker/heap-forge/secrets/docs_revalidation_token \
pnpm --filter docs revalidate:content-cache
```

직접 HTTP 상태를 확인하려면 다음과 같이 호출할 수도 있다.

```bash
read -s DOCS_REVALIDATE_TOKEN
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${DOCS_REVALIDATE_TOKEN}" \
  https://heap-forge.app/api/revalidate/content
unset DOCS_REVALIDATE_TOKEN
```

성공 응답의 `revalidated: true`를 확인한 후 해당 목록 또는 상세 페이지를
새로 요청한다. webhook은 데이터를 미리 가져오는 것이 아니라 캐시를 즉시
만료시키므로, 다음 페이지 요청이 NAS API의 최신 응답을 가져온다.

정책 문서:
`docs/architecture/docs-content-cache-revalidation-policy.md`

## Image Architecture

Docker image는 NAS의 CPU architecture와 일치해야 한다.

NAS에서 확인한다.

```bash
uname -m
docker info --format '{{.Architecture}}'
```

현재 배포 대상 NAS는 `linux/amd64`로 확인됐으며 Compose와 GitHub Actions도 이 platform으로 고정한다.

일반적인 대응 관계:

- `x86_64`: `linux/amd64`
- `aarch64`, `arm64`: `linux/arm64`

Apple Silicon Docker Desktop에서 별도 platform 없이 만든 local image는 보통 `linux/arm64`다. 이 이미지는 `linux/amd64` NAS에서 직접 실행할 수 없다.

## Automated AMD64 Publish

기본 게시 방식은 `.github/workflows/docs-backend-image.yml`을 사용한다.

- pull request: `linux/amd64` build만 검증하고 push하지 않는다.
- `main` 관련 경로 변경: GHCR에 자동 게시한다.
- 수동 실행: GitHub Actions의 `Docs Backend Image`에서 `Run workflow`로 선택한 ref를 게시한다.

workflow는 별도의 PAT 대신 repository의 `GITHUB_TOKEN`과 `packages: write` 권한으로 게시한다. 게시되는 image는 다음 형식의 immutable tag를 갖는다.

```txt
ghcr.io/imhojeong/web-tech-docs-backend:sha-<full-git-sha>
```

첫 게시 후 GitHub package 설정에서 visibility가 `private`인지 확인하고, package의 Actions access에 이 repository가 연결되어 있는지 확인한다.

## Manual Publish Fallback

GitHub Actions를 사용할 수 없을 때만 로컬에서 NAS와 같은 `linux/amd64` image를 GHCR에 게시한다.

로컬 게시에는 GitHub Packages write 권한이 있는 별도 token을 사용한다. token을 저장소 파일이나 shell history에 직접 기록하지 않는다.

```bash
export DOCS_BACKEND_IMAGE=ghcr.io/imhojeong/web-tech-docs-backend
export DOCS_BACKEND_TAG="sha-$(git rev-parse HEAD)"

echo "$GHCR_TOKEN" | docker login ghcr.io -u IMHOJEONG --password-stdin

docker buildx build \
  --platform linux/amd64 \
  --file apps/docs-backend/Dockerfile \
  --tag "${DOCS_BACKEND_IMAGE}:${DOCS_BACKEND_TAG}" \
  --push \
  .
```

배포 tag는 `latest`보다 Git SHA나 release version처럼 변경되지 않는 값을 사용한다. GHCR package가 private이면 NAS에는 `read:packages` 권한만 있는 별도 token을 사용한다.

NAS의 `.env.nas`에는 게시한 immutable image tag를 기록한다.

```dotenv
DOCS_BACKEND_IMAGE=ghcr.io/imhojeong/web-tech-docs-backend:sha-<full-git-sha>
DOCS_BACKEND_PLATFORM=linux/amd64
```

NAS에서 image를 받은 뒤 build 없이 실행한다. NAS token에는 package download에 필요한 `read:packages` 권한만 부여하고 content API token과 재사용하지 않는다.

```bash
echo "$GHCR_READ_TOKEN" | docker login ghcr.io -u IMHOJEONG --password-stdin

docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  pull docs-backend

docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  up -d --no-build docs-backend
```

## Transfer Image Without Registry

registry를 사용하지 않으면 NAS architecture 하나를 지정해 image archive를 만든다. 아래 예시는 `x86_64` NAS 기준이다.

```bash
docker buildx build \
  --platform linux/amd64 \
  --file apps/docs-backend/Dockerfile \
  --tag heap-forge/docs-backend:0.1.0 \
  --load \
  .

docker save heap-forge/docs-backend:0.1.0 | gzip > docs-backend-0.1.0.tar.gz
scp docs-backend-0.1.0.tar.gz <nas-user>@<nas-host>:/volume1/docker/heap-forge/
```

NAS에서 archive를 불러온다.

```bash
gzip -dc /volume1/docker/heap-forge/docs-backend-0.1.0.tar.gz | docker load
```

이 경우 `.env.nas`의 `DOCS_BACKEND_IMAGE`를 `heap-forge/docs-backend:0.1.0`으로 설정한 뒤 `docker compose up -d --no-build`를 실행한다. 수동 archive 방식은 architecture별 파일 관리와 업데이트 자동화가 필요하므로 GHCR 방식보다 운영 비용이 크다.

## Deploy

NAS에서 source를 직접 build해야 하는 경우에만 다음 명령을 사용한다.

```bash
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  up -d --build
```

Compose는 다음 안전장치를 적용한다.

- non-root Node user
- read-only root filesystem
- read-only Markdown volume
- Docker secret token mount
- all Linux capabilities dropped
- `no-new-privileges`
- project-scoped bridge network와 host loopback port bind
- healthcheck와 log rotation

## Network Mode Decision

기본 Compose는 Synology DSM처럼 reverse proxy가 NAS host에서 실행되는 구성을 대상으로 한다. 따라서 일반 bridge network를 사용하고 container port는 `127.0.0.1`에만 게시한다.

```txt
NAS host reverse proxy -> 127.0.0.1:8000 -> docs-backend container
```

`internal: true`인 Docker network는 host network interface와 연결되지 않으므로 이 구성에 사용하지 않는다. Compose에 port mapping이 선언되어 있어도 실제 host port가 게시되지 않을 수 있다.

참고: [Docker Compose networking - Internal networks](https://docs.docker.com/compose/how-tos/networking/#internal-networks)

reverse proxy도 컨테이너로 실행한다면 반대로 host port를 게시하지 않고 두 컨테이너를 같은 internal 또는 external shared network에 연결한다.

```txt
proxy container -> docs-backend:8000
```

이 경우 proxy container만 public network와 internal shared network 양쪽에 연결하고, docs-backend는 internal shared network에만 연결한다. 두 방식을 섞지 않는다.

## Reverse Proxy

NAS reverse proxy의 upstream은 다음과 같이 둔다.

```txt
Protocol: HTTP
Host: 127.0.0.1
Port: 8000
```

위 주소는 Synology DSM처럼 NAS host에서 실행되는 reverse proxy 기준이다. Nginx Proxy Manager나 Traefik도 컨테이너라면 그 컨테이너의 `127.0.0.1`은 NAS host가 아니므로 연결되지 않는다. 이 경우 host port를 게시하지 않고 두 컨테이너를 별도 shared Docker network에 연결한 뒤 upstream을 `docs-backend:8000`으로 지정한다.

외부 host는 `https://api.heap-forge.app`처럼 별도 도메인을 사용한다. NAS firewall에서 `8000`을 개방하지 않고 HTTPS용 `443`만 reverse proxy에 허용한다.

허용 경로:

- `GET /api/posts`
- `GET /posts/*`

차단 경로:

- `/health`
- write/upload/admin endpoint
- NAS content volume의 raw filesystem path

인증된 목록과 본문 응답은 `Cache-Control: private, no-store`, `Vary: Authorization`을 반환한다. reverse proxy나 CDN에서 이 헤더를 덮어쓰거나 content endpoint를 public cache하지 않는다.

## Frontend Configuration

`apps/docs` 배포 환경에는 다음을 설정한다.

```dotenv
BLOG_CONTENT_API_BASE_URL_PUBLIC=https://api.heap-forge.app
BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC=https://api.heap-forge.app
BLOG_CONTENT_API_TOKEN=<same value as the Docker secret>
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true
```

토큰은 `NEXT_PUBLIC_*` 이름으로 만들지 않는다. 브라우저가 아니라 Next.js server runtime에서만 전송해야 한다.

## Verification

NAS 내부:

```bash
curl --fail http://127.0.0.1:8000/health
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  ps
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  port docs-backend 8000
```

외부 endpoint:

```bash
curl -i https://api.heap-forge.app/api/posts
curl --fail \
  -H "Authorization: Bearer $BLOG_CONTENT_API_TOKEN" \
  https://api.heap-forge.app/api/posts
curl --fail \
  -H "Authorization: Bearer $BLOG_CONTENT_API_TOKEN" \
  https://api.heap-forge.app/posts/web/event-loop
```

기대 결과:

- 토큰 없는 content 요청은 `401`
- 올바른 토큰의 목록과 상세 요청은 `200`
- host reverse proxy 방식에서는 port 조회 결과가 `127.0.0.1:8000`이어야 함
- `/health` 외부 요청은 reverse proxy에서 `404` 또는 `403`
- 컨테이너가 unhealthy이면 reverse proxy로 트래픽을 보내지 않는다.
- 콘텐츠 응답이 public proxy cache에 저장되지 않는다.

## Update And Rollback

업데이트 전 content volume을 별도로 백업한다. 운영에서는 immutable GHCR 이미지를 pull하고 콘텐츠는 read-only volume으로 유지한다.

```bash
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  pull docs-backend
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  up -d --no-build docs-backend
```

문제가 있으면 `DOCS_BACKEND_IMAGE`를 이전 immutable tag 또는 digest로 되돌린 뒤 같은 명령으로 재기동한다. NAS에서의 source build는 registry를 사용할 수 없는 fallback 절차로만 사용한다. token file과 content volume은 이미지 rollback과 분리한다.
