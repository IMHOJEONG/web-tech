# Docs Backend

`apps/docs`에 원격 Markdown 목록과 본문 HTML을 제공하는 NestJS 애플리케이션이다. 프론트와 API 계약은 같은 저장소에서 관리하지만 배포와 런타임은 분리한다.

## Local Development

```bash
pnpm install
cp apps/docs-backend/.env.example apps/docs-backend/.env
pnpm dev:docs-backend
```

프론트에는 동일한 secret과 로컬 API endpoint를 서버 전용 환경 변수로 설정한다.

```dotenv
BLOG_CONTENT_API_BASE_URL=http://localhost:8000
BLOG_CONTENT_MARKDOWN_BASE_URL=http://localhost:8000
BLOG_CONTENT_API_TOKEN=replace-with-a-long-random-secret
```

## Content Layout

게시 파일은 `{channel}/{leaf-slug}.md`만 허용한다.

```txt
content/
  posts/
    feed/
    web/
    mobile/
    ui-ux/
  assets/
```

게시 가능한 frontmatter는 다음과 같다. `status`가 없거나 `draft`, `archived`이면 API에서 노출하지 않는다. `published` 문서에서 필수 필드가 빠지거나 파일명과 `slug`가 다르면 해당 문서를 건너뛴다.

```md
---
title: Event Loop
slug: event-loop
summary: 브라우저 이벤트 루프의 실행 순서를 정리합니다.
date: 2026-09-08
updatedAt: 2026-09-08
status: published
authorName: HoJeong Im
authorRole: Web Engineer
readMinutes: 4
topicLabel: WEB
tags:
  - javascript
---
```

공유 규격은 `packages/docs-content-contract`가 관리한다. 프론트와 백엔드는 channel, status, route, 날짜, published metadata 스키마를 이 패키지에서 가져온다.

## Endpoints

```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer $CONTENT_API_TOKEN" \
  http://localhost:8000/api/posts
curl -H "Authorization: Bearer $CONTENT_API_TOKEN" \
  http://localhost:8000/posts/web/event-loop
```

`/health`만 공개하고 콘텐츠 endpoint는 Bearer token을 요구한다. TLS는 NestJS가 아니라 reverse proxy 또는 배포 플랫폼에서 종료한다.

## Verification

```bash
pnpm check:docs-backend
pnpm --filter docs-backend test:e2e
pnpm --filter docs-backend build
pnpm --filter @web-tech/docs-content-contract test
```

## NAS Deployment

NAS에서는 API 컨테이너를 외부 포트로 직접 공개하지 않는다. Compose 기본값은 NAS host의 `127.0.0.1:8000`에만 bind하고, NAS reverse proxy가 이 주소로 전달하도록 한다.

```bash
cp apps/docs-backend/.env.nas.example apps/docs-backend/.env.nas
mkdir -p apps/docs-backend/secrets
openssl rand -hex 32 > apps/docs-backend/secrets/content_api_token
docker compose \
  --env-file apps/docs-backend/.env.nas \
  -f apps/docs-backend/docker-compose.yml \
  up -d --build
```

프론트 배포 환경의 `BLOG_CONTENT_API_TOKEN`에는 `content_api_token` 파일과 같은 값을 등록한다. 외부 HTTPS는 NAS reverse proxy에서 종료하고 `/api/posts`, `/posts/*`만 upstream으로 전달한다. `/health`, container port, content volume은 외부에 공개하지 않는다.
