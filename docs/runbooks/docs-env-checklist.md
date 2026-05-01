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

| Variable                            | Used In Code                 | `.env.example` | `turbo.json` | Vercel  | Notes                        |
| ----------------------------------- | ---------------------------- | -------------- | ------------ | ------- | ---------------------------- |
| `BETTER_AUTH_SECRET`                | Yes                          | Yes            | Yes          | Yes     | 실제 비밀값, 절대 커밋 금지  |
| `BETTER_AUTH_URL`                   | Potential runtime dependency | Yes            | Yes          | Yes     | 앱 기본 URL                  |
| `BLOG_CONTENT_API_BASE_URL`         | Yes                          | Yes            | Yes          | Yes     | 목록 메타데이터 API base URL |
| `BLOG_CONTENT_API_POSTS_PATH`       | Yes                          | Yes            | Yes          | Yes     | 기본값은 `/api/posts`        |
| `BLOG_CONTENT_MARKDOWN_BASE_URL`    | Yes                          | Yes            | Yes          | Yes     | 본문 HTML API base URL       |
| `BLOG_CONTENT_MARKDOWN_PATH_PREFIX` | Yes                          | Yes            | Yes          | Yes     | 기본값은 `/posts`            |
| `BLOG_CONTENT_REVALIDATE_SECONDS`   | Yes                          | Yes            | Yes          | Yes     | ISR 주기, 기본값은 `300`     |
| `CLOUDFLARE_API_TOKEN`              | Repo-level usage             | No             | Yes          | If used | `docs` 앱 전용은 아님        |

## Local Setup

예시:

```env
BETTER_AUTH_SECRET=replace-with-your-secret
BETTER_AUTH_URL=http://localhost:3000
BLOG_CONTENT_API_BASE_URL=http://localhost:8000
BLOG_CONTENT_API_POSTS_PATH=/api/posts
BLOG_CONTENT_MARKDOWN_BASE_URL=http://localhost:8000
BLOG_CONTENT_MARKDOWN_PATH_PREFIX=/posts
BLOG_CONTENT_REVALIDATE_SECONDS=300
```

권장:

- 실제 값은 `apps/docs/.env.local` 또는 플랫폼 환경변수에만 둔다.
- `apps/docs/.env.example`는 placeholder만 유지한다.

## Pre-deploy Checks

배포 전 아래를 확인한다.

1. `apps/docs/.env.example`에 필요한 키가 모두 적혀 있는가
2. `turbo.json`의 `globalEnv`에 같은 키가 선언되어 있는가
3. Vercel 프로젝트에 같은 키가 등록되어 있는가
4. 배포 URL 기준으로
   - `${BLOG_CONTENT_API_BASE_URL}${BLOG_CONTENT_API_POSTS_PATH}`
   - `${BLOG_CONTENT_MARKDOWN_BASE_URL}${BLOG_CONTENT_MARKDOWN_PATH_PREFIX}/{slug-or-path}`
     가 실제 응답하는가
5. 목록 API의 `markdownPath` 값이 본문 API 라우트 규칙과 일치하는가

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

조치:

- `/api/posts` 응답 shape 확인
- Vercel env 값 확인

### Detail page is empty

원인 후보:

- `markdownPath`와 실제 본문 라우트 불일치
- 본문 API가 `404`
- HTML이 아닌 응답이 와서 프론트가 거부

조치:

- `/posts/{markdownPath}` 직접 호출
- 필요 시 `markdownPath` 규칙 수정

## Related Docs

- [docs/architecture/blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs/architecture/blog-content-html-vs-markdown.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-html-vs-markdown.md)
