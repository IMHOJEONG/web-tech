# 2026-08-23 Docs Local / Remote Content Policy And Examples

## 배경

원격 문서 로드 실패 시 로컬 문서만으로 사이트를 유지할 수 있게 되면서, 어떤 문서를 로컬에 두고 어떤 문서를 원격에 둘지 기준이 필요해졌다.

## 변경

- `docs/architecture/docs-local-vs-remote-content-policy.md`를 추가했다.
- `docs/architecture/docs-content-authoring-pipeline.md`에 local content 책임을 추가했다.
- `docs/runbooks/docs-contributor-guide.md`에 content placement 기준을 보강했다.
- 로컬 fallback 품질을 확인할 수 있는 published 예시 문서를 추가했다.

## 추가한 로컬 예시 문서

- `apps/docs/data/v8/javascript-event-loop-runtime.mdx`
- `apps/docs/data/shadcn/focus-management-checklist.mdx`
- `apps/docs/category/fe/react/server-client-component-boundary.mdx`
- `apps/docs/category/be/node-js/http-timeout-retry-boundary.mdx`
- `apps/docs/category/computer-science/os/process-thread-scheduler.mdx`

## 기준

로컬 문서:

- evergreen 지식
- category baseline
- 원격 서버 장애 시에도 보여야 하는 핵심 문서
- 앱 코드와 함께 리뷰되어야 하는 문서

원격 문서:

- 최신 블로그 글
- 실험 기록
- 이미지와 asset이 자주 바뀌는 글
- 앱 배포 없이 추가/수정해야 하는 글

## 검증 포인트

- `pnpm --filter docs test:content`
- `pnpm --filter docs test:lib`
- 원격 서버를 끈 상태에서 `/feed`, `/docs`, 검색 화면이 로컬 문서만으로 렌더링되는지 확인
