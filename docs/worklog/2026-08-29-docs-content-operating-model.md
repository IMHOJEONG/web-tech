# Docs Content Operating Model

Date: 2026-08-29

## Context

`apps/docs`는 local MDX와 remote content API를 함께 사용한다.

최근 작업에서 원격 API timeout, local fallback, canonical route, content validation 이슈가 반복되었고, 콘텐츠 운영 모델을 더 명확히 고정할 필요가 생겼다.

## Decision

`hybrid content model`을 채택한다.

- local MDX는 baseline / evergreen / fallback 콘텐츠를 담당한다.
- remote content API는 배포 없이 갱신되는 운영형 블로그 콘텐츠를 담당한다.
- 글 업로드는 local authoring + explicit publish workflow로 분리한다.
- `apps/docs` 앱 런타임은 read-only consumer로 유지한다.

## Result

- `docs/architecture/docs-content-operating-model.md`를 추가했다.
- `docs-content-authoring-pipeline.md`의 추천 모델을 Remote Storage Upload 기본, Git-backed Repo 장기 승격 후보로 정리했다.
- `docs-local-vs-remote-content-policy.md`와 roadmap에서 새 운영 모델 문서를 참조하도록 연결했다.
- `docs/todo/todo.md`의 콘텐츠 운영 모델 항목을 완료 처리했다.
