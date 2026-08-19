# 2026-08-08 Docs Blog Improvement Roadmap

## What Changed

블로그 개선 포인트를 단일 roadmap 문서로 정리하고, 관련 architecture 문서와 `todo`를 함께 보강했다.

이번 정리 범위:

- `todo`에 실행 가능한 개선 과제 추가
- 블로그 개선 roadmap 문서 신설
- authoring / routing / search / API contract 문서 보강

## Updated Docs

### 1. Roadmap

- `docs/architecture/docs-blog-improvement-roadmap.md`

정리한 내용:

- 메타데이터 우선 정책
- `/docs/{channel}/{slug}` canonical route 강화
- 검색 품질 고도화 방향
- 테스트/quality gate 기준
- contributor guide 필요 항목
- 중기 후보
  - rendering convergence
  - related posts / previous-next
  - taxonomy expansion
  - telemetry
  - freshness signals

### 2. TODO

- `docs/todo/todo.md`

추가한 항목:

- 블로그 개선 roadmap 기준 문서화
- frontmatter / remote metadata schema 고정
- canonical route 강화
- rendering 전략 통일 검토
- docs 콘텐츠 흐름 테스트 자동화
- contributor-facing 운영 가이드 작성
- article detail 읽기 보조 UX
- taxonomy / telemetry 확장 검토

### 3. Existing Architecture Docs

- `docs/architecture/docs-content-authoring-pipeline.md`
  - contributor baseline
  - recommended frontmatter baseline
  - publish validation 책임 보강
- `docs/architecture/docs-content-routing-policy.md`
  - hub vs detail 역할 분리
  - canonical source와 redirect 규칙 명시
- `docs/architecture/docs-search-experience-policy.md`
  - 다음 단계 ranking 목표
  - near-term enhancement
  - measurement candidate 보강
- `docs/architecture/blog-content-api-contract.md`
  - `updatedAt`, `tags`, `status` 포함 권장 editorial metadata 보강

## Why

이전에는 블로그 개선 포인트가 여러 문서에 흩어져 있었다.

이번 정리는 다음 목적을 가진다.

1. 새 개선 과제가 생겼을 때 먼저 넣을 canonical 문서를 만든다.
2. UI 변경이 메타데이터, 라우팅, 검색, 테스트 기준과 따로 놀지 않게 한다.
3. 단기 작업과 중기 후보를 같은 문맥에서 판단할 수 있게 한다.

## Next Recommended Steps

1. frontmatter / remote payload 필드의 필수/선택 여부를 실제 코드 검증으로 연결
2. search relevance scoring 초안 설계
3. route normalize / payload schema / search smoke test 추가
4. contributor guide 초안 작성
