# Docs Content Authoring Pipeline

## Purpose

이 문서는 `apps/docs`에 노출될 글을 어떤 경로로 작성하고, 어떤 경로로 원격 저장소에 올릴지 정리합니다.

핵심 목표는 두 가지입니다.

1. 작성자는 로컬 환경에서 글을 안전하게 작성하고 검증할 수 있어야 한다.
2. 앱 런타임의 읽기 경로와 글 업로드 경로를 분리해 운영 리스크를 줄여야 한다.

## Core Decision

글 작성/업로드는 `로컬에서 원격에 직접 접근하는 authoring pipeline`으로 두는 것이 맞다.

다만 중요한 점은:

- `docs 앱`이 글을 읽는 런타임 경로
- 작성자가 글을 올리는 업로드 경로

이 둘을 같은 시스템 책임으로 합치지 않는 것이다.

즉:

- `apps/docs`
  - 읽기 전용 consumer
- `authoring / publish workflow`
  - 쓰기 전용 producer

로 나눈다.

## Recommended Architecture

### Runtime Read Path

`apps/docs`는 현재처럼 원격 콘텐츠를 읽는다.

- 목록 메타데이터: content API
- 본문 HTML: content body endpoint
- 실패 시: local fallback 또는 별도 fallback 전략

이 경로의 책임:

- 문서 렌더링
- 검색/피드/인덱스 표시
- remote fetch fallback

이 경로는 `publish`를 수행하지 않는다.

### Authoring Write Path

작성자는 로컬에서 글을 작성한 뒤, 별도 publish workflow를 통해 원격 저장소에 올린다.

이 경로의 책임:

- frontmatter 검증
- slug/path 규칙 검증
- 로컬 preview
- 원격 저장소 업로드
- 필요 시 index/API 재생성 트리거

이 경로는 앱 사용자 요청 처리와 분리한다.

## Why Separation Matters

### 1. 운영 안정성

런타임 앱이 읽기와 쓰기를 동시에 책임지면:

- 권한 범위가 커지고
- 보안 표면이 넓어지고
- 업로드 실패가 사용자-facing runtime에 영향을 줄 수 있다

반대로 read/write를 분리하면:

- docs 앱은 읽기만 보장하면 되고
- 업로드 실패는 authoring workflow 안에서만 관리할 수 있다

### 2. 권한 관리

원격 콘텐츠 저장소에 쓰기 권한은 민감하다.

따라서:

- 앱 서버에는 read credential만
- 작성자 로컬 또는 CI publish job에는 write credential만

두는 쪽이 더 안전하다.

### 3. 변경 추적

글 업로드는 보통 다음이 중요하다.

- 누가 올렸는가
- 언제 수정했는가
- rollback 가능한가

이 요구는 app runtime보다 별도 publish workflow에 더 잘 맞는다.

### 4. 작성 경험

작성자는 앱 UI 안에서 글을 쓰기보다:

- 로컬 editor
- lint/preview
- frontmatter validation
- publish command

같은 흐름에서 더 안정적으로 작업할 수 있다.

## Recommended Workflow

### Option A: Git-backed Remote Content Repo

가장 추천하는 방식이다.

흐름:

1. 로컬에서 MDX/markdown 작성
2. preview 및 validation 실행
3. 별도 content repository 또는 content branch에 commit/push
4. 원격 content system이 이를 읽어 index 또는 HTML endpoint 갱신
5. `apps/docs`는 기존 read path로 소비

장점:

- 변경 이력 관리 쉬움
- rollback 쉬움
- review workflow 붙이기 쉬움
- 글 하나씩 올리는 운영에 적합

### Option B: Remote Storage Upload

원격 저장소가 git repo가 아니라 NAS, object storage, file server일 때 사용한다.

흐름:

1. 로컬 작성
2. validation
3. upload script로 remote path에 복사
4. 필요 시 metadata index 갱신

장점:

- 단순함

단점:

- versioning/review/rollback 체계가 약해질 수 있음

### Option C: CMS/API Direct Publish

지금 단계에서는 권장하지 않는다.

적합한 경우:

- 다수 작성자
- draft/review/publish 상태 머신
- 관리자 UI 필요

현재처럼 글을 하나씩 올리는 단계에서는 과하다.

## Recommendation For This Repo

현재 구조에서는 `Option A` 또는 `Option B`가 맞다.

특히 지금 상황에 더 잘 맞는 판단은:

- 로컬에서 작성
- 로컬에서 preview
- 로컬 publish script 실행
- 원격 저장소에 직접 업로드
- 앱은 읽기만 수행

즉, `로컬에서 원격에 직접 접근해 업로드하는 authoring pipeline`을 두는 것이 맞다.

## Suggested Responsibilities

### `apps/docs`

- 글 읽기
- 피드/인덱스/상세 렌더링
- 검색
- remote fetch fallback
- 앱 공통 UI 이미지 관리
  - 로고
  - OG 기본 이미지
  - hero 장식 이미지
  - placeholder/fallback asset

### `publish script`

- 파일 존재 확인
- frontmatter schema 검사
- slug uniqueness 검사
- thumbnail/path 규칙 검사
- remote upload
- optional invalidate/rebuild trigger

## Image Ownership Policy

블로그 이미지는 성격에 따라 ownership을 나누는 것이 좋다.

### 1. 콘텐츠 이미지

글 본문에 직접 포함되는 이미지는 `content repo / backend storage`에서 관리하는 쪽을 권장한다.

예:

- 글 본문 캡처 이미지
- 다이어그램
- 글 전용 thumbnail
- 문서에 종속된 illustration

이유:

- 글과 이미지가 함께 versioning 된다
- 글을 이동/삭제할 때 asset 관계를 같이 추적할 수 있다
- 작성/업로드 pipeline 안에서 함께 검증할 수 있다
- 프론트 배포와 무관하게 콘텐츠만 갱신할 수 있다

권장 구조 예:

```txt
content/
  posts/
    web/
      rendering-pipeline.md
  assets/
    web/
      rendering-pipeline/
        hero.webp
        diagram-01.png
```

또는 더 단순하게:

```txt
content/
  posts/
    web/
      rendering-pipeline.md
      rendering-pipeline-hero.webp
```

### 2. 프론트 앱 이미지

문서 본문과 직접 결합되지 않은 이미지는 `apps/docs` 또는 프론트 static asset에서 관리하는 편이 맞다.

예:

- 사이트 로고
- 브랜드 장식 요소
- 홈/허브 공통 fallback image
- 기본 OG image
- 공용 placeholder

이유:

- 제품 UI 자산이기 때문에 콘텐츠 lifecycle과 분리된다
- 디자인 시스템과 함께 버전 관리하기 쉽다
- 페이지 chrome 변경과 함께 다루기 좋다

### Practical Recommendation

이 레포 기준으로는 아래처럼 나누는 것이 가장 현실적이다.

- `글 내용에 종속된 이미지`
  - backend/content side
- `사이트 UI에 종속된 이미지`
  - frontend side

즉 블로그 글에 넣는 실제 article image는 보통 `프론트`보다 `콘텐츠 저장소/백엔드`에서 관리하는 쪽이 더 자연스럽다.

### Frontmatter Recommendation

글 메타에 thumbnail을 둘 때는 frontend 상대 경로보다 `content source` 기준 경로를 권장한다.

예:

```md
---
title: "Rendering Pipeline"
thumbnail: "web/rendering-pipeline/hero.webp"
---
```

또는 절대 URL/CDN을 쓸 수도 있다.

```md
---
thumbnail: "https://cdn.example.com/blog/web/rendering-pipeline/hero.webp"
---
```

### What To Avoid

- 글 이미지가 `apps/docs/public`와 backend storage 양쪽에 중복 저장되는 구조
- 글 삭제 후 이미지 orphan cleanup이 안 되는 구조
- 콘텐츠 이미지가 frontend deploy에만 묶여 있어, 글 수정 때마다 앱을 다시 배포해야 하는 구조

## Suggested Commands

예시:

```bash
pnpm docs:preview-post path/to/post.mdx
pnpm docs:validate-post path/to/post.mdx
pnpm docs:publish-post path/to/post.mdx
```

또는 여러 편을 한 번에 다룰 수 있게:

```bash
pnpm docs:publish-draft --slug my-post
```

## What Not To Do

권장하지 않는 방식:

- `apps/docs` 런타임 안에 write credential 주입
- 사용자-facing request 안에서 content upload 수행
- app route에서 바로 remote publish API 실행
- read fallback과 publish workflow를 같은 코드 경로에 혼합

## Future Extensions

나중에 필요하면 다음을 추가할 수 있다.

- draft/published 상태 관리
- release note 자동 생성
- publish queue
- CMS 어드민 UI
- scheduled publish

하지만 현재는:

- local authoring
- explicit publish
- separated read/write path

이 가장 적절하다.

## Related Docs

- [docs-content-rendering-strategy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-rendering-strategy.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [blog-content-html-vs-markdown.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-html-vs-markdown.md)
- [docs/runbooks/docs-env-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-env-checklist.md)
