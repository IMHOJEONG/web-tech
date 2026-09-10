# Docs Contract And NAS Deployment

## Goal

`apps/docs`와 새 NestJS `apps/docs-backend`가 따로 정의하던 콘텐츠 규격을 공유 패키지로 분리하고, 백엔드를 NAS 내부 컨테이너에 안전하게 배포할 수 있는 기준을 만든다.

## Changes

- `packages/docs-content-contract`에 channel, status, route, canonical date, published frontmatter, 목록 응답 스키마를 통합했다.
- 프론트의 원격 payload parser는 공유 패키지를 re-export해 기존 호환성을 유지했다.
- 로컬 콘텐츠 validator도 공유 status, slug, date 규칙을 사용하도록 연결했다.
- NestJS는 모든 published metadata를 명시적으로 검증하고 canonical 목록 응답을 반환한다.
- NestJS e2e에서 인증, published/draft/archived 필터, traversal 차단, asset URL, code language metadata를 확인한다.
- CI에 프론트-백엔드 content contract e2e 단계를 추가했다.
- NAS Compose에 loopback port bind, Docker secret, read-only filesystem/content mount, non-root user, capability drop, healthcheck, log rotation을 적용했다.
- 인증 응답에 private no-store와 Authorization vary를 적용하고 graceful shutdown을 활성화했다.

## Contract Decision

두 입력 계층을 구분한다.

- legacy-compatible input: 기존 원격 서버 이관 중 프론트가 읽을 수 있는 느슨한 payload
- canonical output: 새 NestJS가 반드시 반환해야 하는 엄격한 payload

백엔드는 누락된 작성자, 읽기 시간, topic, 수정일을 임의 추론하지 않는다. 게시 파일이 계약을 만족하지 않으면 목록에서 제외하고 상세는 `404`로 처리한다.

## NAS Boundary

```txt
apps/docs server -> HTTPS reverse proxy -> 127.0.0.1:8000 -> docs-backend
```

- TLS와 공개 path 제한은 NAS reverse proxy가 담당한다.
- 컨테이너는 raw content volume을 읽기 전용으로 mount한다.
- read token은 파일 secret으로 주입하고 Git/Compose YAML에 값을 기록하지 않는다.
- 이미지 asset origin과 Markdown API를 분리한다.
- NAS host reverse proxy 방식에서는 일반 bridge와 `127.0.0.1` port bind를 사용한다.
- `internal: true` network는 host interface와 연결되지 않으므로 proxy도 컨테이너인 shared-network 방식에서만 사용한다.

## Verification

```bash
pnpm --filter @web-tech/docs-content-contract test
pnpm --filter docs test:content
pnpm --filter docs test:lib
pnpm --filter docs-backend check
docker compose --env-file apps/docs-backend/.env.nas.example \
  -f apps/docs-backend/docker-compose.yml config
```

실제 NAS에서는 `.env.nas.example`이 아니라 Git에서 제외된 `.env.nas`와 token secret 파일을 사용한다.

검증 결과:

- 공유 계약 test 4건, typecheck, lint, ESM/CJS build 통과
- NestJS unit 4건, e2e 5건, typecheck, lint, production build 통과
- docs 콘텐츠 test 14건, lib test 89건, typecheck, lint 통과
- Docker Compose config 해석과 production deploy 패키징 통과

## Local HTTP Integration Verification

2026-09-10에 Node.js 24.12.0 환경에서 임시 published 문서를 사용해 실제 HTTP 연동을 확인했다. fixture는 `/tmp`에만 생성하고 검증 후 저장소에 포함하지 않았다.

백엔드 경계:

- `GET /health`: `200`
- token 없는 `GET /api/posts`: `401`
- token을 포함한 `GET /api/posts`: `200`
- token을 포함한 `GET /posts/web/integration-check`: `200`
- 목록과 상세 응답에서 `Cache-Control: private, no-store`, `Vary: Authorization` 확인
- 목록의 thumbnail 상대 경로가 `CONTENT_ASSET_BASE_URL` 기준 절대 URL로 변환됨
- 상세 HTML에 heading과 `language-ts` 코드 블록이 보존됨

프론트 경계:

- Next.js를 로컬 NestJS endpoint에 연결한 뒤 `/docs?q=Integration`: `200`
- `/docs/web/integration-check`: `200`
- runtime source 로그에서 검색과 index는 `mixed`, 상세는 `remote`로 기록됨
- warm request 기준 검색 index 약 `174ms`, 상세 약 `280ms`
- 상세 metadata, canonical URL, summary, 본문, 코드 언어 정보를 확인함

장애 격리:

- NestJS를 중단해 `ECONNREFUSED`를 재현했다.
- `/docs`는 로컬 문서만으로 `200`을 반환했다.
- `/docs/web/javascript-event-loop-runtime`은 로컬 상세 fallback으로 `200`을 반환했다.
- runtime source 로그에서 `remote-detail-unavailable-local-fallback`과 `source: local`을 확인했다.
- 실패한 원격 요청이 사이트 전체 오류로 전파되지 않았다.

## Docker Smoke Verification

로컬 Docker Desktop에서 NAS Compose와 같은 조건으로 production image를 빌드했다.

- `.dockerignore` 적용 후 build context 약 `616KB`
- Node.js 24 slim builder와 runtime image 생성 성공
- frozen lockfile install, shared contract build, NestJS production build 성공
- container healthcheck `healthy`
- runtime user `node`
- read-only root filesystem 적용
- Linux capabilities `ALL` drop 확인
- `no-new-privileges:true` 확인
- Markdown volume과 token secret 모두 read-only mount 확인

첫 smoke test에서 `internal: true` network와 `127.0.0.1` port publishing을 동시에 사용하면 container 내부 healthcheck는 통과하지만 host port가 게시되지 않는 충돌을 확인했다. 기본 배포 대상이 NAS host reverse proxy이므로 project-scoped 일반 bridge와 loopback bind 조합으로 수정했다.

수정 후 재검증 결과:

- host port `127.0.0.1:8010 -> container:8000` 게시 확인
- host 경유 `/health`: `200`
- token 없는 `/api/posts`: `401`
- token을 포함한 목록과 상세: `200`
- container Node.js `v24.20.0`
- production image 크기 약 `84.6MB`
- token 값은 container environment에 없고 `CONTENT_API_TOKEN_FILE` 경로만 존재함

실제 NAS reverse proxy의 TLS 인증서, public path allowlist, 외부 `/health` 차단은 NAS 배포 후 별도로 확인해야 한다.

## Image Distribution Decision

로컬 smoke image는 Apple Silicon Docker Desktop에서 생성되어 `linux/arm64`였고, 실제 NAS는 `linux/amd64`로 확인됐다. 따라서 기존 local image를 NAS에 그대로 전달할 수 없다.

- 기본 배포 방식은 GHCR image pull로 정한다.
- 현재 production image platform은 NAS architecture와 같은 `linux/amd64`로 고정한다.
- image tag는 mutable한 `latest` 대신 `sha-<git-sha>`를 사용한다.
- Compose는 `DOCS_BACKEND_IMAGE`로 registry image를 선택한다.
- NAS에서는 `docker compose pull` 후 `up -d --no-build`로 실행한다.
- registry를 사용하지 못할 때만 NAS platform으로 단일 image를 build하고 tar archive로 전달한다.

현재 local buildx builder는 `linux/amd64` build를 지원한다. GHCR publish 자체는 registry 인증 정보가 필요한 운영 작업이므로 별도로 수행한다.
