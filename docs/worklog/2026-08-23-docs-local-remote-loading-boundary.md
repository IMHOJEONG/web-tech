# 2026-08-23 Docs Local / Remote Loading Boundary

## 배경

원격 문서 서버가 응답하지 않으면 `/feed`와 문서 목록 화면 전체가 오류 페이지로 전환되는 문제가 있었다.

이 구조에서는 원격 문서 API가 단일 장애점이 되어, 로컬에 포함된 문서까지 사용할 수 없게 된다.

## 변경

- `apps/docs/lib/get-document.ts`
  - 로컬 문서 로드와 원격 문서 로드를 분리했다.
  - 원격 목록 요청 실패 시 빈 원격 목록으로 낮추고 로컬 문서만 렌더링한다.
  - 원격/로컬 문서가 같은 공개 route를 만들면 원격 문서를 우선하고 중복을 제거한다.
  - 원격 상세 요청 실패 시 동일 route의 로컬 문서를 fallback으로 찾는다.
- `apps/docs/lib/get-search-data.ts`
  - 검색 색인도 로컬/원격을 분리했다.
  - 원격 검색 색인 로드 실패 시 로컬 문서만으로 검색을 계속 수행한다.
- `docs/runbooks/content-api-auth-ops-runbook.md`
  - 원격 endpoint fallback과 로컬 렌더링 fallback의 차이를 문서화했다.

## 정책

원격 content API 실패는 원격 문서 영역의 실패로 제한한다.

목록/검색:

- 로컬 문서는 항상 표시 가능한 기본 데이터로 본다.
- 원격 문서 로드가 실패해도 화면 전체를 오류 상태로 보내지 않는다.
- 원격과 로컬의 route가 겹치면 원격 문서를 우선한다.

상세:

- 동일 route의 로컬 문서가 있으면 원격 요청보다 로컬 문서를 먼저 사용한다.
- 로컬 문서가 없는 route만 원격 상세 요청을 시도한다.
- 로컬 문서도 없으면 기존 오류 또는 not found 흐름을 따른다.

## 주의

- `401/403`에서 다른 endpoint 후보를 계속 시도하지 않는 기존 정책은 유지한다.
- 이번 변경은 endpoint fallback이 아니라 local / remote source fallback이다.
- 운영 로그에서는 원격 실패를 계속 남겨야 한다. 화면을 살리는 것과 장애를 숨기는 것은 다르다.

## 2026-08-23 Follow-up

Vercel runtime에서 원격 content API 530 이후 10초 timeout이 발생할 수 있어 추가 조정했다.

- 상세 route는 로컬 문서를 먼저 찾고, 로컬 문서가 없을 때만 원격 상세 요청을 시도한다.
- 원격 content API 요청은 `BLOG_CONTENT_API_TIMEOUT_MS` 기준으로 fail-fast 한다.
- 기본 timeout은 `2500ms`다.

## 2026-08-23 Follow-up 2

fail-fast 적용 후에도 상세 페이지에서 Vercel runtime timeout이 남을 수 있는 원인을 점검했다.

원인은 원격 API 자체보다 로컬 문서 탐색 기준일 수 있다.

- 기존 로컬 문서 루트는 `process.cwd()/data`만 사용했다.
- 모노레포 배포 환경에서는 `process.cwd()`가 repo root로 잡힐 수 있다.
- 이 경우 실제 문서는 `apps/docs/data` 아래에 있어도 로컬 문서로 감지되지 않는다.
- 로컬 문서가 감지되지 않으면 `/docs/web/...` 상세 route가 원격 상세 조회로 떨어지고, 원격 API 장애가 다시 Vercel timeout으로 이어질 수 있다.

조치:

- `apps/docs/lib/get-document.ts`에서 로컬 문서 루트 후보를 `data`, `apps/docs/data`로 확장했다.
- 로컬 문서 상대경로는 실제 data 디렉터리의 부모 기준으로 계산해 `data/v8/...` 매핑을 유지했다.

## 2026-08-23 Follow-up 3

Vercel 로그에서 `Remote search index unavailable. Searching local docs only.` 이후에도 runtime timeout이 남는 흐름을 추가 점검했다.

상세 문서 로더는 로컬 루트 후보를 보강했지만, 검색 인덱스와 카테고리 로더에는 아직 `process.cwd()` 기준 경로가 남아 있었다.

영향:

- `/docs?q=...` 검색 페이지와 `/api/search`가 로컬 검색 문서를 찾지 못할 수 있다.
- `/web`, `/mobile`, `/ui-ux` 허브가 검색 인덱스 기반 문서 목록을 만들 때 배포 환경의 cwd 차이에 영향을 받을 수 있다.
- 원격 API가 530 상태이면 검색/허브가 원격 실패 후 로컬 fallback으로 내려가야 하지만, 로컬 루트가 비어 있으면 fallback 품질이 떨어지고 runtime timeout 원인 추적이 어려워진다.

조치:

- `apps/docs/lib/local-content-paths.ts`를 추가해 로컬 콘텐츠 루트 탐색을 공통화했다.
- `data`, `category`, `apps/docs/data`, `apps/docs/category` 계열을 실행 위치에 상관없이 안정적으로 탐색한다.
- `apps/docs/lib/get-document.ts`, `apps/docs/lib/get-search-data.ts`, `apps/docs/lib/get-category.ts`가 같은 로컬 콘텐츠 루트 기준을 사용하도록 통일했다.
- `apps/docs/lib/local-content-paths.test.ts`로 direct docs root와 monorepo root 케이스를 검증한다.

## 2026-08-23 Follow-up 4

카테고리 상세 페이지에서 로컬 문서 데이터가 정상 출력된 뒤 Vercel runtime timeout이 발생하는 흐름을 추가 점검했다.

관찰:

- `getCategoryData()`는 정상적으로 로컬 문서를 반환했다.
- `/category/[main]/[sub]/[slug]/page.tsx`의 첫 debug log는 찍혔다.
- `evaluate()` 이후에 있던 두 번째 debug log는 찍히지 않았다.

원인 후보:

- 데이터 로딩이 아니라 MDX 평가/렌더링 단계가 10초 제한에 걸리는 구조였다.
- 카테고리 상세 라우트가 공용 article renderer와 분리된 오래된 렌더 경로를 사용했다.
- 해당 경로에서 `rehypeShiki`를 직접 초기화해 serverless cold start 비용이 커질 수 있었다.
- 운영 로그에 전체 문서 배열과 React content를 출력하는 debug log가 남아 있었다.

조치:

- 카테고리 상세 라우트를 공용 `renderArticleContent()` 흐름으로 합쳤다.
- 카테고리 상세에서는 우선 `codeHighlight: false`로 Shiki 초기화를 피한다.
- 문서가 없으면 빈 MDX를 평가하지 않고 `notFound()`로 빠진다.
- 운영 debug log를 제거했다.

## 2026-08-23 Follow-up 5

배포 후에도 Vercel runtime timeout이 남아 로컬 프로덕션 검증 방법을 추가했다.

로컬 확인 결과:

- `next build`는 성공했다.
- `next start` 기준 `/category/fe/react/server-client-component-boundary` 첫 요청은 `200`, 약 `0.46s`였다.
- 반복 요청은 약 `0.04s`였다.
- `/`, `/feed`, `/docs`도 로컬 프로덕션 기준 1초 안에 응답했다.
- 따라서 현재 브랜치 코드 기준으로 category 상세 렌더링 자체의 10초 timeout은 로컬에서 재현되지 않았다.

추가 조치:

- `apps/docs/scripts/check-prod-routes.mjs`를 추가했다.
- `pnpm --filter docs check:prod-routes`로 주요 라우트의 상태 코드와 응답 시간을 한 번에 확인한다.
- 기본 임계값은 `5000ms`이며 `DOCS_PROD_CHECK_MAX_TOTAL_MS`로 조정할 수 있다.
- 기본 요청 timeout은 `10000ms`이며 `DOCS_PROD_CHECK_TIMEOUT_MS`로 조정할 수 있다.

사용 예:

```bash
pnpm --filter docs build
cd apps/docs
./node_modules/.bin/next start --port 3003
DOCS_PROD_CHECK_BASE_URL=http://localhost:3003 pnpm --filter docs check:prod-routes
```

해석:

- 로컬 prod route check가 통과하는데 Vercel만 timeout이면, 코드의 순수 렌더 비용보다 배포 환경의 원격 API 지연, 환경 변수, stale deployment, edge/cache 상태를 우선 의심한다.
- `/feed`, `/docs`, `/`는 원격 API 실패 후 로컬 fallback으로 내려오는 경로라 원격 endpoint가 느리게 실패하면 배포 환경에서만 지연될 수 있다.
