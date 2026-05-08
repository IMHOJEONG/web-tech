# Docs Env Checklist

## Purpose

`apps/docs`에서 사용하는 환경변수가 아래 네 군데에서 서로 어긋나지 않도록 확인하기 위한 기준표다.

1. 로컬 실행 파일
   - `apps/docs/.env.local` 또는 비공개 env 파일
2. 예시 파일
   - `apps/docs/.env.example`
3. Turbo 선언
   - `turbo.json`
4. 배포 플랫폼
   - Vercel Project Environment Variables

## Rule

- 코드에서 `process.env.X`를 읽으면 `turbo.json`에도 선언한다.
- 협업자가 알아야 하는 값이면 `apps/docs/.env.example`에도 placeholder를 둔다.
- 실제 값은 절대 저장소에 커밋하지 않는다.
- 배포에 필요한 값은 Vercel에 등록한다.

## Checklist Table

| Variable                                  | Used In Code                 | `.env.example` | `turbo.json` | Vercel  | Notes                        |
| ----------------------------------------- | ---------------------------- | -------------- | ------------ | ------- | ---------------------------- |
| `BETTER_AUTH_SECRET`                      | Yes                          | Yes            | Yes          | Yes     | 실제 비밀값, 절대 커밋 금지  |
| `BETTER_AUTH_URL`                         | Potential runtime dependency | Yes            | Yes          | Yes     | 앱 기본 URL                  |
| `BLOG_CONTENT_API_BASE_URL`               | Yes                          | Yes            | Yes          | Yes     | 목록 메타데이터 API base URL |
| `BLOG_CONTENT_API_BASE_URL_INTERNAL`      | Optional                     | Yes            | Yes          | If used | 내부망 우선 base URL         |
| `BLOG_CONTENT_API_BASE_URL_PUBLIC`        | Optional                     | Yes            | Yes          | If used | 외부망/public base URL, 우선 |
| `BLOG_CONTENT_API_TOKEN`                  | Optional                     | Yes            | Yes          | If used | server-to-server Bearer 토큰 |
| `BLOG_CONTENT_API_POSTS_PATH`             | Yes                          | Yes            | Yes          | Yes     | 기본값은 `/api/posts`        |
| `BLOG_CONTENT_MARKDOWN_BASE_URL`          | Yes                          | Yes            | Yes          | Yes     | 본문 HTML API base URL       |
| `BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL` | Optional                     | Yes            | Yes          | If used | 내부망 본문 base URL         |
| `BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC`   | Optional                     | Yes            | Yes          | If used | 외부망 본문 base URL, 우선   |
| `BLOG_CONTENT_MARKDOWN_PATH_PREFIX`       | Yes                          | Yes            | Yes          | Yes     | 기본값은 `/posts`            |
| `BLOG_CONTENT_REVALIDATE_SECONDS`         | Yes                          | Yes            | Yes          | Yes     | ISR 주기, 기본값은 `300`     |
| `CLOUDFLARE_API_TOKEN`                    | Repo-level usage             | No             | Yes          | If used | `docs` 앱 전용은 아님        |

## Local Setup

예시:

```env
BETTER_AUTH_SECRET=replace-with-your-secret
BETTER_AUTH_URL=http://localhost:3000
BLOG_CONTENT_API_BASE_URL=http://localhost:8000
BLOG_CONTENT_API_TOKEN=replace-with-server-to-server-token
BLOG_CONTENT_API_POSTS_PATH=/api/posts
BLOG_CONTENT_MARKDOWN_BASE_URL=http://localhost:8000
BLOG_CONTENT_MARKDOWN_PATH_PREFIX=/posts
BLOG_CONTENT_REVALIDATE_SECONDS=300
```

권장:

- 실제 값은 `apps/docs/.env.local` 또는 플랫폼 환경변수에만 둔다.
- `apps/docs/.env.example`는 placeholder만 유지한다.
- 여러 네트워크 역할을 분리하고 싶으면 `*_INTERNAL` / `*_PUBLIC`을 사용한다.
- 코드는 여러 후보를 순차 fallback 하지 않고, 우선순위에 따라 하나의 endpoint만 선택한다.
- 현재 우선순위는 `PUBLIC -> INTERNAL -> DEFAULT`다.
- 콘텐츠 endpoint가 외부에 노출돼 있어도 브라우저 직접 접근을 막고 싶다면 `BLOG_CONTENT_API_TOKEN`으로 server-to-server 인증을 붙인다.

## Pre-deploy Checks

배포 전 아래를 확인한다.

1. `apps/docs/.env.example`에 필요한 키가 모두 적혀 있는가
2. `turbo.json`의 `globalEnv`에 같은 키가 선언되어 있는가
3. Vercel 프로젝트에 같은 키가 등록되어 있는가
4. 배포 URL 기준으로
   - `${BLOG_CONTENT_API_BASE_URL}${BLOG_CONTENT_API_POSTS_PATH}`
   - `${BLOG_CONTENT_MARKDOWN_BASE_URL}${BLOG_CONTENT_MARKDOWN_PATH_PREFIX}/{slug-or-path}`
     가 실제 응답하는가

- 실제 선택되는 endpoint가 `PUBLIC`, `INTERNAL`, `DEFAULT` 중 무엇인지 명확한가
- 토큰 보호를 쓴다면 `Authorization: Bearer <BLOG_CONTENT_API_TOKEN>` 없이 `401/403`이 나는가

5. 목록 API의 `markdownPath` 값이 본문 API 라우트 규칙과 일치하는가
   - 예: `web/test`, `feed/sample`, `ui-ux/blocked-aria-hidden`, `mobile/intro`

## Failure Symptoms

### Vercel warning about missing env in `turbo.json`

원인:

- Vercel에는 등록됐지만 `turbo.json`에 선언되지 않음

조치:

- `turbo.json > globalEnv`에 추가

### Feed is empty

원인 후보:

- 목록 API가 비어 있음
- `slug/title`이 없음
- base URL이 잘못됨
- 현재 환경에서 실제 선택되는 단일 endpoint가 잘못됨
- server-to-server 토큰이 누락되었거나 잘못됨

조치:

- `/api/posts` 응답 shape 확인
- Vercel env 값 확인
- `BLOG_CONTENT_API_BASE_URL_PUBLIC`, `BLOG_CONTENT_API_BASE_URL_INTERNAL`, `BLOG_CONTENT_API_BASE_URL` 중 어떤 값이 선택되는지 확인
- `BLOG_CONTENT_API_TOKEN` 값과 백엔드 기대값 일치 여부 확인

### Detail page is empty

원인 후보:

- `markdownPath`와 실제 본문 라우트 불일치
- 본문 API가 `404`
- HTML이 아닌 응답이 와서 프론트가 거부
- 토큰 검증으로 본문 endpoint가 `401/403`

조치:

- `/posts/{markdownPath}` 직접 호출
- nested path라면 `/posts/web/test`처럼 실제 하위 디렉터리까지 포함해서 호출
- 토큰 보호를 쓴다면 `Authorization` 헤더 포함 호출로 재검증
- 필요 시 `markdownPath` 규칙 수정

## Related Docs

- [docs/architecture/blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs/architecture/blog-content-html-vs-markdown.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-html-vs-markdown.md)
