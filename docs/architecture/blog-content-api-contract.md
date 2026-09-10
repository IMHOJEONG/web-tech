# Blog Content API Contract

## Purpose

`apps/docs`와 `apps/docs-backend` 사이의 목록, 상세 본문, 인증, 콘텐츠 metadata 계약을 정의한다. 실행 가능한 단일 기준은 `packages/docs-content-contract`이며, 문서와 구현이 다르면 공유 패키지의 스키마를 우선한다.

기존 FastAPI 문서는 이관 참고 자료일 뿐 신규 운영 기준이 아니다.

## Ownership

- `packages/docs-content-contract`: channel, status, route, 날짜, frontmatter, 목록 응답 스키마
- `apps/docs-backend`: Markdown 읽기, published 필터, baseline HTML 렌더링, Bearer 인증
- `apps/docs`: legacy payload 호환, 목록 조합, HTML sanitize/normalize, syntax highlighting, UI
- NAS reverse proxy: TLS 종료, 공개 host/path 제한, rate limit과 접근 로그

## Routes

허용 channel은 `feed`, `web`, `mobile`, `ui-ux`다.

```txt
Markdown file  content/posts/{channel}/{slug}.md
Public route   /docs/{channel}/{slug}
List API       GET /api/posts
Body API       GET /posts/{channel}/{slug}
```

`slug`는 lowercase kebab-case leaf slug이며 중첩 경로를 허용하지 않는다. `markdownPath`는 `{channel}/{slug}`이고 API `id`와 같은 값을 사용한다.

## Authentication

`/health`를 제외한 content endpoint는 다음 헤더가 필요하다.

```http
Authorization: Bearer <shared-secret>
```

- 프론트 서버의 `BLOG_CONTENT_API_TOKEN`과 백엔드의 `CONTENT_API_TOKEN` 값은 같다.
- NAS Compose에서는 `CONTENT_API_TOKEN_FILE`로 Docker secret을 읽는다.
- 토큰은 `NEXT_PUBLIC_*` 환경 변수나 브라우저 응답에 포함하지 않는다.
- 인증 실패는 원인을 구분해 노출하지 않고 `401 Unauthorized`로 통일한다.

## Published Frontmatter

`published` 문서는 아래 필드를 모두 명시한다. 백엔드는 읽기 시간, 작성자, topic, 수정일을 추론하지 않는다.

```yaml
---
title: Event Loop
slug: event-loop
summary: 브라우저 이벤트 루프의 실행 순서를 정리합니다.
date: 2026-09-09
updatedAt: 2026-09-09
status: published
authorName: HoJeong Im
authorRole: Web Engineer
readMinutes: 4
topicLabel: WEB
thumbnail: web/event-loop/thumbnail.webp
tags:
  - javascript
  - browser
---
```

규칙:

- `date`, `updatedAt`: 실제 존재하는 `YYYY-MM-DD`
- `slug`: 파일명과 일치하는 lowercase kebab-case
- `readMinutes`: 양의 정수
- `tags`: 문자열 배열이며 빈 배열 허용
- `thumbnail`: 선택 필드이며 상대 경로 또는 절대 URL
- `status`: `draft`, `published`, `archived`; API는 `published`만 노출

## List API

### Request

```http
GET /api/posts
Accept: application/json
Authorization: Bearer <shared-secret>
```

### Canonical Response

```json
{
  "results": [
    {
      "id": "web/event-loop",
      "markdownPath": "web/event-loop",
      "slug": "event-loop",
      "title": "Event Loop",
      "summary": "브라우저 이벤트 루프의 실행 순서를 정리합니다.",
      "date": "2026-09-09",
      "updatedAt": "2026-09-09",
      "status": "published",
      "authorName": "HoJeong Im",
      "authorRole": "Web Engineer",
      "readMinutes": 4,
      "topicLabel": "WEB",
      "thumbnail": "https://assets.heap-forge.app/web/event-loop/thumbnail.webp",
      "tags": ["javascript", "browser"]
    }
  ]
}
```

`apps/docs-backend`는 반환 직전에 `canonicalPostsPayloadSchema`로 응답을 검증한다. 잘못된 개별 파일은 목록에서 제외하고 서버 로그에 경로와 검증 실패를 남긴다.

## Legacy Input Compatibility

`apps/docs`는 이관 기간 동안 배열, `{items: []}`, `{results: []}` 형태와 snake_case alias를 계속 읽을 수 있다. 이 규칙은 기존 원격 서버를 읽기 위한 호환 계층이며, 새 NestJS 출력 규격을 느슨하게 만드는 근거로 사용하지 않는다.

## Body API

### Request

```http
GET /posts/web/event-loop
Accept: text/html
Authorization: Bearer <shared-secret>
```

### Response

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

```html
<!doctype html>
<html>
  <body>
    <article>
      <h1>Event Loop</h1>
      <pre><code class="language-tsx">const run = () =&gt; true;</code></pre>
    </article>
  </body>
</html>
```

백엔드는 Markdown을 안전하게 escape한 baseline HTML과 `language-*` 정보만 만든다. Shiki highlighting, copy button, language badge, 최종 sanitize/normalize는 프론트가 담당한다.

## Error Contract

- `401`: 토큰 누락 또는 불일치
- `404`: 존재하지 않음, 비공개 상태, 잘못된 route, 유효하지 않은 published metadata
- `5xx`: filesystem 또는 예상하지 못한 서버 장애

원격 목록/본문 실패는 `apps/docs` 전체 장애로 전파하지 않는다. 로컬 문서가 있으면 로컬 목록과 상세 fallback을 계속 제공한다.

## Verification

```bash
pnpm --filter @web-tech/docs-content-contract test
pnpm --filter docs test:content
pnpm --filter docs test:lib
pnpm --filter docs-backend test:e2e --runInBand
```

NAS 배포 검증은 [docs-backend-nas-deployment.md](../runbooks/docs-backend-nas-deployment.md)를 따른다.
