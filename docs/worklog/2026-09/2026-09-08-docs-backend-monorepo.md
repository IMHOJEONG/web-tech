# Docs Backend Monorepo App

## Background

원격 Markdown 서버와 `apps/docs`가 다른 저장소 또는 수동 배포 상태로 관리되면서 다음 문제가 반복됐다.

- frontmatter와 API payload 계약의 버전 불일치
- HTML entity와 code block 언어 정보의 비일관성
- 원격 서버 장애 원인과 프론트 fallback 동작 추적 어려움
- 콘텐츠 경로와 공개 URL 규칙의 분산

## Decision

초기 FastAPI 초안은 폐기하고, 저장소의 기존 백엔드 운영 방식과 맞춘 NestJS 앱 `apps/docs-backend`로 다시 구성했다.

- `apps/docs`: 읽기 UI, HTML sanitize/normalize, syntax highlighting
- `apps/docs-backend`: Bearer 인증, Markdown 탐색, frontmatter 검증, 기본 HTML 생성
- reverse proxy 또는 배포 플랫폼: TLS와 public ingress
- asset origin: 이미지 정적 배포

NestJS를 선택한 이유는 모노레포의 Node.js 24, pnpm catalog, TypeScript, ESLint, Jest, Docker 운영 체계를 그대로 재사용하고 프론트와 API 타입 경계를 한 언어로 관리하기 위해서다. `vuln-radar-backend`와는 도메인과 배포 주기가 다르므로 별도 앱으로 유지한다.

## Rendering Boundary

백엔드는 Shiki를 실행하지 않고 아래 baseline HTML만 반환한다.

```html
<pre><code class="language-tsx">escaped source</code></pre>
```

프론트는 HTML sanitize와 entity normalization, syntax highlighting, copy action, language badge, light/dark design token을 담당한다.

## Added Scope

- NestJS application과 public health endpoint
- generic `401 Unauthorized`를 반환하는 Bearer token guard
- `/api/posts` published metadata endpoint
- `/posts/{markdownPath}` HTML endpoint
- `{channel}/{leaf-slug}` 경로 및 frontmatter 검증
- 상대 asset URL 정규화
- Docker와 local Compose configuration
- Jest e2e 계약 테스트와 ESLint/TypeScript 검사
- pnpm workspace convenience commands

## Commands

```bash
pnpm dev:docs-backend
pnpm check:docs-backend
pnpm --filter docs-backend test:e2e
pnpm --filter docs-backend build
```

## Validation Notes

저장소의 보안 override는 `js-yaml` v4를 사용한다. `gray-matter@4`의 기본 YAML engine은 제거된 `safeLoad` API를 호출하므로, 백엔드는 `yaml.parse`를 명시적으로 engine에 주입한다. 이 처리는 frontmatter 파싱 실패가 빈 목록으로 오인되는 상황을 막는다.

검증 결과:

- lint, typecheck, unit test 통과
- Bearer auth, published filtering, traversal rejection e2e 통과
- code fence의 `language-tsx`와 HTML entity escaping 검증
- relative image asset URL 변환 검증
- Nest production build와 `pnpm deploy --legacy --prod` 패키징 통과

## Follow-up

- 운영 콘텐츠를 `apps/docs-backend/content/posts`로 이관한다.
- asset publish/sync 목적지를 `CONTENT_ASSET_BASE_URL`과 맞춘다.
- 배포 환경의 `CONTENT_API_TOKEN`과 frontend의 `BLOG_CONTENT_API_TOKEN`을 같은 secret source에서 주입한다.
- 프론트 contract fixture를 백엔드 e2e 응답과 직접 비교하는 교차 앱 계약 테스트를 추가한다.
