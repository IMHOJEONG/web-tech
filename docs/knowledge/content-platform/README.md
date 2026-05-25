# Content Platform 지식 정리

## 배운 점

- 글 업로드 경로와 앱 런타임의 읽기 경로는 분리하는 편이 안전하다.
- 원격 콘텐츠는 `markdownPath`, `slug`, `id` 역할을 분리해야 라우팅 충돌이 줄어든다.
- 이미지/thumbnail은 글에 종속된 경우 content source 쪽에서 관리하는 편이 자연스럽다.
- `apps/docs`가 외부 배포 환경에 있기 때문에, “내부망에서만 열기”보다 “server-to-server 인증”이 더 현실적이다.
- 콘텐츠 계약은 backend 문서만 믿지 말고 프론트에서도 최소 검증을 걸어야 런타임 사고를 줄일 수 있다.
  - 최근에는 `zod`로 최소 라우트 계약을 검증하도록 보강했다.

## 자주 헷갈리는 부분

- `slug`는 leaf slug이고, 전역 유일성은 보통 `id` 또는 `markdownPath`가 책임진다.
- `next/image remotePatterns`는 `<Image />`에만 적용되고, 원격 HTML 안의 일반 `<img>`에는 적용되지 않는다.
- asset base env는 `next.config`와 서버 정규화 양쪽에서 함께 읽히는지 확인해야 한다.
- `401/403`은 fallback으로 다른 endpoint를 계속 때릴 문제가 아니라, 인증/설정 문제로 보는 편이 맞다.
- raw content URL을 브라우저에서 직접 여는 흐름과 `docs` 서버 fetch 흐름은 분리해서 생각해야 한다.
- `markdownPath`는 실제 파일 경로이고, 공개 URL은 그 경로를 사람이 읽기 좋은 문서 라우트로 풀어낸 결과라는 점을 자주 혼동한다.

## 현재 운영 기준

- 목록 API: `/api/posts`
- 본문 API: `/posts/{markdownPath}`
- 인증: server-to-server token
- asset host: `BLOG_CONTENT_ASSET_BASE_URL_PUBLIC` 우선, `NEXT_PUBLIC_*`는 fallback
- 메타 규칙
  - `id`: 전역 유일값
  - `slug`: leaf slug
  - `markdownPath`: `channel/article-slug`
- authoring pipeline
  - 로컬에서 원격에 직접 업로드
  - 앱 런타임은 read-only consumer
- 이미지 소유권
  - 글 본문 종속 이미지: content side
  - 앱 공통 UI 이미지: frontend side

## 구현하면서 반복 확인한 패턴

- 콘텐츠 플랫폼은 결국 “경로 계약”과 “권한 경계” 두 축으로 정리된다.
  - 경로 계약: `markdownPath`, `slug`, `id`, 공개 URL
  - 권한 경계: read path, publish path, token auth
- 원격 HTML은 그대로 받아도 되지만, 읽기 경험을 위해 프론트 후처리가 필요할 때가 있다.
  - `figure/figcaption` 승격
  - heading anchor 보정
  - 이미지 정렬
- 이미지 이슈는 자주 `next/image` 설정 문제처럼 보이지만, 실제로는 아래 세 가지를 따로 봐야 한다.
  - 원본 asset host 응답 상태
  - `remotePatterns` 빌드 시점 반영 여부
  - 해당 이미지가 `<Image />`인지 일반 `<img>`인지

## 다음 작업자가 먼저 점검할 것

- FastAPI나 sidecar를 바꿀 때
  - `/api/posts`
  - `/posts/{markdownPath}`
  - `id / slug / markdownPath`
    계약이 동시에 유지되는지 확인
- 인증 이슈가 나면
  - `BLOG_CONTENT_API_TOKEN`
  - backend `CONTENT_API_TOKEN`
  - reverse proxy의 `Authorization` 전달
    순서로 점검
- asset 이슈가 나면
  - 실제 asset URL이 200인지
  - build env에 asset host가 반영됐는지
  - `next/image` 경로인지 일반 `<img>` 경로인지
    먼저 구분
- 새 메타 필드를 추가할 때
  - backend payload
  - 프론트 정규화
  - 라우트/검색/피드 사용처
    세 군데를 같이 업데이트

## 먼저 보면 좋은 문서

- `docs/architecture/docs-content-authoring-pipeline.md`
- `docs/architecture/blog-content-api-contract.md`
- `docs/runbooks/content-api-auth-ops-runbook.md`
- `docs/runbooks/fastapi-content-api-reference.md`
- `docs/architecture/docs-content-routing-policy.md`
- `docs/worklog/2026-05-07-content-authoring-pipeline.md`
- `docs/worklog/2026-05-08-content-api-server-to-server-auth.md`
- `docs/worklog/2026-05-15-remote-content-zod-validation.md`
- `docs/worklog/2026-05-21-public-asset-base-server-env-support.md`
