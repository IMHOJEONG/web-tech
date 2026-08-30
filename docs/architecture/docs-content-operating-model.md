# Docs Content Operating Model

Status: fixed on 2026-08-29

## Purpose

이 문서는 `apps/docs` 블로그 콘텐츠를 어떤 운영 모델로 관리할지 고정한다.

핵심 질문은 세 가지다.

- 로컬 문서를 계속 유지할 것인가?
- 원격 콘텐츠 API를 어떤 책임으로 둘 것인가?
- 글 업로드는 앱 런타임과 분리할 것인가?

## Decision

현재 `apps/docs`는 `hybrid content model`을 사용한다.

- 로컬 MDX는 사이트의 baseline / evergreen / fallback 콘텐츠를 담당한다.
- 원격 콘텐츠 API는 배포 없이 추가/수정되는 운영형 블로그 콘텐츠를 담당한다.
- 글 작성과 업로드는 앱 런타임이 아니라 로컬 authoring pipeline과 별도 publish workflow가 담당한다.

즉 `apps/docs`는 콘텐츠를 쓰는 시스템이 아니라 읽는 시스템이다.

## Responsibility Split

### Local MDX

역할:

- 원격 문서 서버가 없어도 사이트의 기본 가치를 유지한다.
- Web, UI/UX, Computer Science 같은 장기 기준 문서를 보관한다.
- 검색/문서 인덱스의 fallback 품질을 보장한다.
- 앱 코드와 함께 리뷰되어야 하는 문서를 포함한다.

위치:

- `apps/docs/data/*`
- `apps/docs/category/*`

적합한 콘텐츠:

- evergreen 개념 문서
- 기술 기준 문서
- 앱 구조와 함께 변경되어야 하는 문서
- 원격 장애 시에도 보여야 하는 대표 문서

### Remote Content API

역할:

- 앱 재배포 없이 글을 추가하거나 수정한다.
- 최신 작업 기록, 실험 기록, 이미지가 많은 문서를 운영한다.
- 목록 API와 본문 API를 통해 `apps/docs`에 읽기 전용 데이터를 제공한다.

권장 source 구조:

```txt
content/
  posts/
    feed/
      pna.md
    web/
      browser-local-network-access.md
    mobile/
      touch-target-debugging.md
    ui-ux/
      dialog-motion-audit.md
  assets/
    feed/
      pna/
        thumbnail.webp
        permissions.png
```

적합한 콘텐츠:

- 최신 블로그 글
- 운영 중 계속 수정되는 트러블슈팅 기록
- 이미지와 첨부 asset이 글과 함께 움직이는 문서
- 앱 배포 없이 빠르게 발행해야 하는 글

### Authoring / Publish Workflow

역할:

- 작성자가 로컬에서 글을 작성한다.
- frontmatter, slug, markdownPath, 이미지 경로를 검증한다.
- 검증이 끝난 콘텐츠만 원격 저장소 또는 content server에 업로드한다.
- 필요하면 remote index rebuild 또는 cache invalidate를 트리거한다.

금지:

- `apps/docs` 사용자 요청 중 content write 수행
- 앱 런타임에 write credential 주입
- read fallback 로직과 publish 로직을 같은 경로에 섞기

## Read Path

`apps/docs` 런타임은 읽기 전용이다.

목록/검색:

- 로컬 문서는 항상 독립적으로 로드한다.
- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`이면 원격 목록도 함께 로드한다.
- 원격 목록 실패는 사이트 전체 실패로 전파하지 않고 로컬 문서만으로 계속 렌더링한다.

상세:

- 같은 canonical route에 local / remote 문서가 모두 있으면 원격 문서를 우선한다.
- 원격 상세가 실패하면 동일 route의 로컬 문서를 fallback으로 사용한다.
- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 로컬 문서를 우선하고, 로컬에 없는 route만 원격을 시도한다.

## Conflict Policy

같은 공개 route를 local과 remote가 동시에 만들 수 있다.

기본 정책:

- remote 우선
- local fallback

이유:

- remote는 더 최신 publish pipeline에서 나온 문서일 가능성이 높다.
- 목록에서 remote 카드가 보였는데 상세에서 local 본문이 열리는 불일치를 줄인다.
- local은 baseline이자 장애 대응용으로 남긴다.

예외:

- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`에서는 목록/검색/상세 모두 local-first로 동작한다.

## Endpoint Policy

원격 API endpoint는 한 번에 하나만 선택한다.

- `PUBLIC`, `INTERNAL`, 기본 URL을 동시에 순회하지 않는다.
- 인증 실패인 `401/403`은 fallback 대상이 아니다.
- 네트워크 timeout / DNS failure 같은 장애만 별도 fallback 정책을 검토할 수 있다.

이 기준은 다음 문서를 따른다.

- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs-content-api-fail-fast-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-api-fail-fast-policy.md)

## Publishing Model

현재 단계에서는 CMS/API direct publish를 도입하지 않는다.

채택:

- local authoring
- validation
- explicit publish workflow
- remote content server는 read API 제공

보류:

- 앱 내부 관리자 UI
- 브라우저에서 직접 markdown 작성/업로드
- 다중 작성자 draft/review/publish 상태 머신
- CMS 기반 direct publish API

이유:

- 현재는 글을 하나씩 안전하게 올리는 것이 우선이다.
- 앱 런타임 보안 표면을 작게 유지해야 한다.
- Git 또는 파일 기반 publish workflow가 rollback과 변경 추적에 더 단순하다.

## Operational Checks

콘텐츠를 추가하거나 수정한 뒤 최소 아래를 확인한다.

```bash
pnpm --filter docs validate:content
pnpm --filter docs test:lib
CI=true BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false pnpm --filter docs build
```

원격 콘텐츠 API를 변경한 경우:

```bash
curl -H "Authorization: Bearer $BLOG_CONTENT_API_TOKEN" \
  "$BLOG_CONTENT_API_BASE_URL_PUBLIC/api/posts"
```

확인 기준:

- local validation이 경고 없이 통과하는가?
- remote payload가 contract와 맞는가?
- canonical route가 `/docs/{path}`로 계산되는가?
- 원격 API 장애 시에도 로컬 목록/검색이 보이는가?

## Related Docs

- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [docs-local-vs-remote-content-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-local-vs-remote-content-policy.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs-contributor-guide.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-contributor-guide.md)
- [content-api-auth-ops-runbook.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/content-api-auth-ops-runbook.md)
