# Docs Content API Fail-Fast Policy

## Purpose

이 문서는 `apps/docs`가 원격 content API를 호출할 때 왜 fail-fast 정책을 사용하는지 정리한다.

fail-fast는 실패 가능성이 높은 외부 의존성을 오래 붙잡지 않고, 짧은 시간 안에 실패로 판정한 뒤 안전한 대체 흐름으로 넘어가는 정책이다.

## Problem

원격 문서 서버가 느리거나 장애 상태일 때, 앱 서버가 응답을 오래 기다리면 다음 문제가 생긴다.

- Vercel runtime timeout에 먼저 걸릴 수 있다.
- 로컬 문서 fallback까지 도달하지 못할 수 있다.
- `/feed`, `/docs`, 검색, 상세 페이지가 원격 API 상태에 같이 묶인다.
- 사용자는 로컬 문서만으로도 볼 수 있는 화면까지 오류로 경험한다.

즉 원격 content API가 사이트 전체의 단일 장애점이 된다.

## Policy

`apps/docs`는 원격 content API 요청에 짧은 timeout을 적용한다.

현재 기본값:

```env
BLOG_CONTENT_API_TIMEOUT_MS=2500
```

동작:

1. 원격 API가 timeout 안에 응답하면 정상 처리한다.
2. timeout 안에 응답하지 않으면 원격 content fetch를 실패로 본다.
3. 목록/검색은 기본적으로 원격 문서를 로컬 문서와 합친다.
4. `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`일 때만 목록/검색에서 원격 문서를 제외한다.
5. 기본값 또는 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`이면 상세 페이지도 원격 문서를 먼저 사용한다.
6. 원격 상세가 실패하거나 없으면 동일 route의 로컬 문서를 fallback으로 사용한다.
7. `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 로컬 문서를 먼저 사용하고, 로컬 문서가 없는 route만 원격 상세 요청을 시도한다.

## Why 2500ms

Vercel serverless runtime에서는 요청이 오래 걸리면 전체 handler가 timeout될 수 있다.

원격 문서 API는 docs 앱의 보조 데이터 소스이므로, 전체 페이지 응답 시간을 오래 점유하면 안 된다.

`2500ms`는 아래 균형을 위한 기본값이다.

- 일시적인 네트워크 지연은 어느 정도 허용
- Vercel 10초 제한까지 밀리지 않음
- 로컬 fallback으로 전환할 시간이 남음
- 사용자에게 빈 화면이나 전체 오류를 보여줄 가능성을 줄임

필요하면 운영 환경에서 더 짧게 조정할 수 있다.

## What Fail-Fast Is Not

fail-fast는 장애를 숨기는 정책이 아니다.

- 원격 API 실패 로그는 남긴다.
- 인증 실패나 530 같은 upstream 문제는 운영 이슈로 추적한다.
- 다만 사용자 화면이 원격 장애에 같이 묶이지 않게 한다.

fail-fast는 endpoint fallback과도 다르다.

- `401/403`이 발생해도 다른 endpoint 후보를 계속 시도하지 않는다.
- 현재 운영 기준은 단일 endpoint 선택이다.
- fail-fast는 해당 endpoint가 느리거나 실패할 때 빠르게 대체 렌더링으로 넘어가는 정책이다.

## Recommended Use

fail-fast가 적합한 경우:

- 원격 content API
- 외부 검색 API
- 원격 이미지 metadata API
- 사용자가 없어도 페이지가 최소 기능을 유지할 수 있는 보조 의존성

fail-fast를 신중히 써야 하는 경우:

- 결제 승인
- 글 publish 같은 쓰기 작업
- 데이터 정합성이 중요한 저장 작업
- 실패 후 재시도가 중복 부작용을 만들 수 있는 작업

## Current Implementation

관련 코드:

- `apps/docs/lib/content-api-config.ts`
  - `getContentApiTimeoutMs()`
- `apps/docs/lib/content-api.ts`
  - 목록 API와 본문 API 요청에 `timeout` 적용
- `apps/docs/lib/get-document.ts`
  - 기본값 또는 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`일 때 상세 route도 원격 우선, 실패 시 로컬 fallback
  - `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`일 때 로컬 문서 우선, 로컬에 없는 route만 원격 상세 fallback
- `apps/docs/lib/get-search-data.ts`
  - 검색 index에서 원격 실패 시 로컬 검색 문서를 사용
- `apps/docs/lib/get-category.ts`
  - 카테고리 문서도 같은 로컬 콘텐츠 루트 기준을 사용
- `apps/docs/lib/local-content-paths.ts`
  - 모노레포/Vercel 실행 위치 차이를 고려해 `data`, `category`, `apps/docs/data`, `apps/docs/category` 계열을 같은 기준으로 탐색

환경 변수:

```env
BLOG_CONTENT_API_TIMEOUT_MS=2500
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true
```

`BLOG_CONTENT_INCLUDE_REMOTE_INDEX`를 생략하면 `true`로 동작한다.

`BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 `/feed`, `/docs`, 검색, 허브 목록은 원격 API URL이 설정되어 있어도 원격 목록 API를 호출하지 않는다.

## Deployment Pitfall

로컬 문서 fallback이 있어도 배포 환경에서 runtime timeout이 계속 발생하면, 먼저 로컬 문서 루트가 올바르게 잡히는지 확인한다.

모노레포에서는 실행 위치가 환경마다 달라질 수 있다.

- 로컬 `apps/docs` 기준 실행: `process.cwd()/data`
- Vercel 또는 repo root 기준 실행: `process.cwd()/apps/docs/data`

로컬 문서 루트를 찾지 못하면 `/docs/web/...`처럼 로컬에 있는 상세 route도 원격 상세 조회로 떨어질 수 있다.

이 경우 fail-fast timeout 이전에 다음 문제가 발생한다.

- 로컬 문서를 사용할 수 있는데도 원격 `/api/posts`를 호출한다.
- 원격 API가 530 또는 지연 상태이면 상세 페이지가 Vercel runtime timeout에 묶일 수 있다.
- 로그에는 원격 상세 fallback 경고가 남지만 실제 원인은 로컬 문서 탐색 실패일 수 있다.

기본값 또는 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`인 운영 환경에서는 위 로그가 정책상 정상일 수도 있다.
이 모드에서는 목록/검색/상세의 정합성을 위해 같은 route가 겹칠 때 원격 문서를 우선한다.

## Pre-Deploy Route Timing Check

배포 전에는 로컬 프로덕션 서버에서 주요 라우트 응답 시간을 확인한다.

```bash
pnpm --filter docs build
cd apps/docs
./node_modules/.bin/next start --port 3003
DOCS_PROD_CHECK_BASE_URL=http://localhost:3003 pnpm --filter docs check:prod-routes
```

기본 체크 라우트:

- `/`
- `/feed`
- `/docs`
- `/docs?q=react`
- `/web`
- `/mobile`
- `/ui-ux`
- `/category/fe/react/server-client-component-boundary`

환경 변수:

- `DOCS_PROD_CHECK_BASE_URL`: 요청 대상 origin, 기본값 `http://localhost:3003`
- `DOCS_PROD_CHECK_TIMEOUT_MS`: 요청 timeout, 기본값 `10000`
- `DOCS_PROD_CHECK_MAX_TOTAL_MS`: 실패로 볼 최대 응답 시간, 기본값 `5000`

로컬 체크가 통과하는데 Vercel만 timeout이면 아래를 먼저 확인한다.

- 배포가 최신 커밋을 포함했는지
- Vercel 환경 변수의 원격 API URL이 의도한 값인지
- 원격 API가 530을 즉시 반환하는지, 연결을 오래 붙잡는지
- 목록/검색 라우트가 원격 API 실패를 기다리느라 로컬 fallback 도달이 늦어지는지

## Related Docs

- [content-api-auth-ops-runbook.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/content-api-auth-ops-runbook.md)
- [docs-local-vs-remote-content-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-local-vs-remote-content-policy.md)
- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
