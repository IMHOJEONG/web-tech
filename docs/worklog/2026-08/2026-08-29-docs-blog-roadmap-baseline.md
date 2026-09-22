# Docs Blog Roadmap Baseline

Date: 2026-08-29

## Context

`apps/docs` 블로그 개선 작업이 metadata, canonical route, search contract, content validation, contributor guide까지 진행되면서 기존 roadmap의 미완료 표현과 현재 상태가 어긋나기 시작했다.

## Decision

`docs/architecture/docs-blog-improvement-roadmap.md`를 블로그 개선의 기준 문서로 고정한다.

신규 과제는 먼저 `docs/todo/todo.md`에 추가하고, 운영 규칙으로 승격되면 roadmap 또는 관련 architecture/runbook 문서에 연결한다.

## Baseline

- local MDX와 remote payload의 editorial metadata 의미 체계를 고정한다.
- 상세 문서 canonical route는 `/docs/{path}`로 수렴한다.
- `/docs?q=...`와 `/api/search`는 shared ranking / preview / highlight helper를 기준으로 한다.
- content validation과 lib tests를 배포 전 기본 검증으로 둔다.
- contributor-facing 작성 규칙은 `docs/runbooks/docs-contributor-guide.md`를 따른다.

## Follow-Up

- 콘텐츠 운영 모델 확정
- local MDX와 remote rendering convergence
- taxonomy / series / stale signal 확장 검토
