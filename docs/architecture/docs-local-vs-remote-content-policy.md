# Docs Local vs Remote Content Policy

## Purpose

이 문서는 `apps/docs`에서 어떤 글을 로컬 문서로 유지하고, 어떤 글을 원격 문서 서버로 운영할지 정리한다.

상위 운영 모델은
`docs/architecture/docs-content-operating-model.md`를 따른다.

핵심 기준은 단순하다.

- 로컬 문서: 사이트가 원격 서버 없이도 기본 가치를 유지하기 위한 evergreen 문서
- 원격 문서: 배포 없이 계속 추가/수정되는 운영형 블로그 콘텐츠

## Local Content

로컬 문서는 repository에 포함되는 문서다.

권장 위치:

- `apps/docs/data/v8/*`
  - Web / browser / JavaScript runtime evergreen 문서
  - 예: V8, event loop, rendering, browser API
- `apps/docs/data/shadcn/*`
  - UI/UX / accessibility / component behavior evergreen 문서
  - 예: focus management, dialog accessibility, drawer interaction
- `apps/docs/category/fe/*`
  - FE category index에서 오래 유지할 기준 문서
  - 예: React boundary, routing, rendering strategy
- `apps/docs/category/be/*`
  - BE category index에서 오래 유지할 기준 문서
  - 예: API timeout, retry, auth boundary
- `apps/docs/category/computer-science/*`
  - CS category index에서 오래 유지할 기준 문서
  - 예: OS, network, database, security 기본 개념

로컬 문서에 넣기 좋은 항목:

- 원격 서버 장애 시에도 반드시 보여주고 싶은 핵심 글
- 자주 바뀌지 않는 evergreen 지식
- 사이트의 카테고리 구조를 설명하는 기준 문서
- 검색/피드 fallback 품질을 유지하기 위한 대표 문서
- 앱 코드와 함께 리뷰되어야 하는 문서

로컬 문서에 넣지 않는 편이 좋은 항목:

- 자주 수정되는 draft
- 이미지가 많고 asset 교체가 잦은 글
- 배포 없이 빠르게 발행해야 하는 글
- 작성/수정 주기가 앱 릴리즈와 다른 글

## Remote Content

원격 문서는 content API와 body endpoint를 통해 읽는 문서다.

권장 위치:

- 원격 content repository
- NAS 또는 object storage 기반 markdown 저장소
- FastAPI sidecar가 읽는 `content/posts/{channel}/{slug}.md`

원격 문서에 넣기 좋은 항목:

- 최신 블로그 글
- 실험 기록
- 주기적으로 업데이트되는 트러블슈팅 기록
- 이미지와 첨부 asset이 함께 움직이는 글
- 앱 배포 없이 추가하고 싶은 글

원격 문서 channel 기준:

- `feed/{slug}.md`
  - 최신 글, 운영 노트, 실험 회고
- `web/{slug}.md`
  - browser, frontend runtime, web performance
- `mobile/{slug}.md`
  - mobile UX, app runtime, device behavior
- `ui-ux/{slug}.md`
  - accessibility, design system, interaction

## Conflict Policy

같은 공개 route를 로컬 문서와 원격 문서가 동시에 만들 수 있다.

이 경우 원격 문서를 우선한다.

이유:

- 원격 문서는 최신 authoring pipeline에서 발행된 문서일 가능성이 높다.
- 로컬 문서는 fallback / baseline 역할에 더 가깝다.
- 중복 카드 노출을 막아 목록과 검색 결과를 안정적으로 유지한다.
- 목록/검색에서 원격 카드가 보였는데 상세에서 로컬 본문이 열리는 불일치를 막는다.

단, 이 우선순위는 기본값 또는 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`일 때 적용한다.

`BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`에서는 목록/검색이 원격 문서를 포함하지 않으므로, 로컬 상세도 원격 장애에 묶이지 않게 로컬 문서를 먼저 사용한다.

## Failure Policy

원격 문서 API 실패는 사이트 전체 실패로 전파하지 않는다.

목록/검색:

- 로컬 문서는 독립적으로 로드한다.
- 원격 목록 로드는 기본적으로 수행한다.
- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`일 때만 원격 목록을 로컬 목록/검색에서 제외한다.
- 원격 목록 로드가 실패하면 원격 문서는 빈 목록으로 처리한다.
- 화면은 로컬 문서만으로 계속 렌더링한다.

상세:

- 기본값 또는 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=true`이면 원격 상세를 먼저 시도한다.
- 원격 상세 로드가 실패하면 동일 route의 로컬 문서를 fallback으로 사용한다.
- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 로컬 문서를 먼저 사용하고, 로컬에 없는 route만 원격 상세를 시도한다.
- 로컬 문서도 없으면 기존 error / not found 흐름을 따른다.

주의:

- 이 정책은 다른 endpoint 후보로 fallback한다는 뜻이 아니다.
- `401/403`은 여전히 인증/설정 문제로 보고 다른 endpoint를 계속 시도하지 않는다.
- 원격 API URL이 설정되어 있어도 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 목록/검색은 원격 API를 호출하지 않는다.

## Practical Examples

로컬에 두기 좋은 예시:

- `apps/docs/data/v8/javascript-event-loop-runtime.mdx`
- `apps/docs/data/shadcn/focus-management-checklist.mdx`
- `apps/docs/category/fe/react/server-client-component-boundary.mdx`
- `apps/docs/category/be/node-js/http-timeout-retry-boundary.mdx`
- `apps/docs/category/computer-science/os/process-thread-scheduler.mdx`

원격에 두기 좋은 예시:

- `feed/pna.md`
  - 특정 이슈를 해결한 최신 작업 기록
- `web/browser-local-network-access.md`
  - Chrome 버전 변화에 따라 계속 갱신될 수 있는 글
- `ui-ux/dialog-motion-audit.md`
  - 디자인/인터랙션 실험과 이미지가 함께 바뀌는 글
- `mobile/touch-target-debugging.md`
  - 실제 디바이스 테스트 기록

## Authoring Rule

새 글을 작성할 때 먼저 아래 질문을 한다.

1. 원격 서버가 죽어도 반드시 보여야 하는가?
2. 6개월 뒤에도 큰 수정 없이 유효한 기준 문서인가?
3. 앱 코드 변경과 함께 리뷰되어야 하는가?

위 질문에 많이 해당하면 로컬 문서에 둔다.

반대로 아래 질문에 해당하면 원격 문서에 둔다.

1. 배포 없이 빠르게 발행해야 하는가?
2. 이미지와 첨부 asset이 자주 바뀌는가?
3. 운영 중 계속 수정될 가능성이 높은가?

## Related Docs

- [docs-content-operating-model.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-operating-model.md)
- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [content-api-auth-ops-runbook.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/content-api-auth-ops-runbook.md)
