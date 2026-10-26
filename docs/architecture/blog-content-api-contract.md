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
      "searchText": "Event Loop Promise microtask와 task의 실행 순서를 확인합니다.",
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

## 본문 검색 텍스트

`searchText`는 검증된 published 본문의 검색 전용 문자열이다. 새 NestJS 목록은 매 문서에 생성하며 비어 있는 본문은 `""`로 보낸다. frontmatter·draft·archived·본문 검증 실패 파일의 텍스트는 포함하지 않는다. 표시 텍스트·링크 라벨·이미지 alt·인라인/블록 코드는 포함하고 Markdown 구문·링크 destination·이미지 경로는 제외한다. 토큰 기반 추출 후 NFC·공백을 정리한다. 코드의 줄바꿈·서식 복원용 데이터가 아니다.

이관 중 구형 생산자도 허용하도록 공유 스키마는 이 필드를 선택적으로 유지한다. 프론트 호환 입력은 누락/null/빈 문자열을 허용하지만 숫자·객체 등은 오류다. 필드가 없는 목록은 metadata-only 검색이며 임의로 HTML/body alias나 과거 로컬 본문을 대신 검색하지 않는다. 렌더링용 `content`와 구분하고 HTML로 실행하지 않는다. 인증·`private, no-store`·`Vary: Authorization`·공개 상태 규칙은 유지한다. 상세 API에서 별도로 가져오는 본문 계약은 바꾸지 않는다.

선택 이유·배포 및 캐시 경계는 [ADR-0019](adr-0019-remote-body-search.md)를 따른다. 목록 크기 제한은 다음 정책을 따른다.

## 목록 응답 크기 제한

2026-10-26 로컬 구현에서 공유 `CONTENT_POSTS_WARN_BYTES`(512KiB)·`CONTENT_POSTS_MAX_BYTES`(1MiB)를 사용한다. 대상은 인증된 `GET /api/posts`의 전체 JSON이며 압축 전 UTF-8 바이트다. 정확히512KiB까지 정상, 초과~1MiB까지 전체 응답과 수치 경고, 1MiB 초과는503이다. 문서 수·searchText 글자 수나 gzip 크기 기준이 아니다. 일부 글·본문을 자르거나 metadata-only로 바꾸지 않는다.

프론트는 목록 스트림 누적 바이트를 JSON.parse 전에 제한한다. identity의 과대한 Content-Length는 미리 거절하지만 헤더만 신뢰하지 않는다. 압축 해제 후 상한 초과도 abort/cancel·`too-large`로 실패시켜 기존 로컬 fallback을 사용한다. deadline·retry0·TTL·태그·웹훅은 유지한다. 원격 전용 결과와 목록 의존 상세의 가용성 영향, 초기 수치 선택 이유·한계는 [ADR-0020](adr-0020-content-posts-byte-budget.md)을 따른다. 운영 배포·실제 NAS corpus는 미검증이다. 상세 HTML 제한은 아래 별도 정책이며 공개 검색 결과 자체의 byte budget은 아직 없다.

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

## 상세 HTML 응답 크기 제한

공유 `CONTENT_HTML_WARN_BYTES`(512KiB)·`CONTENT_HTML_MAX_BYTES`(1MiB)는 목록과 독립된 상수다. 전체 렌더 결과의 압축 전 UTF-8 bytes를 사용하며 doctype·wrapper·escape된 코드·표도 센다. 외부 이미지/영상 파일 크기는 포함하지 않는다. 정확히512KiB는 정상, 초과~1MiB는 전체 HTML과 생산자 수치 경고, 1MiB 초과는503이다. 일부 HTML을 잘라 성공 응답으로 보내지 않는다.

프론트는 스트림에서 같은 상한을 normalize/sanitize 전에 검사하고 `too-large`를 로더까지 전달한다. 로컬 사본이 있으면 기존 상세 fallback, 없으면 오류이며404/null로 바꾸지 않는다. 목록 inline body는 기존 목록 상한의 보호를 받으며 우선순위·별도 endpoint 조회 여부는 바꾸지 않는다. 초기 값·선택 이유·처리 단계별 한계는 [ADR-0021](adr-0021-content-html-byte-budget.md), 실행 결과는 [HTML 경계 검증](../verification/content/2026-10-26-html-response-budget.md)을 따른다.

## Error Contract

- `401`: 토큰 누락 또는 불일치
- `404`: 존재하지 않음, 비공개 상태, 잘못된 route, 유효하지 않은 published metadata
- `503`: 목록 JSON 또는 상세 HTML의 응답 byte budget 초과 (부분 응답 없음)
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
