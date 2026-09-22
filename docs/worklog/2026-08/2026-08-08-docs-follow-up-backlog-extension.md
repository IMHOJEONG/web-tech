# 2026-08-08 Docs Follow-Up Backlog Extension

## What Changed

최근 반영한 docs 품질 개선의 후속 항목을 backlog와 roadmap에 바로 연결했다.

이번에 추가한 후속 주제:

1. `/api/search` 응답 contract 정리
2. remote payload schema failure 관측/알림 정책
3. search highlight / excerpt의 visual token 정리

## Why

지금까지의 개선으로:

- search ranking
- payload validation
- render smoke test
- CI test coverage

까지는 닫혔지만, 운영과 consumer contract 관점의 다음 질문이 남아 있었다.

- page와 API가 같은 검색 규칙을 보장해야 하는가
- remote contract drift를 어디까지 운영에서 감지할 것인가
- highlight UI를 design token 기준으로 더 정교하게 다듬어야 하는가

이 항목들을 backlog로 올려두어 다음 세션에서 바로 이어갈 수 있게 했다.

## Documentation Updates

수정한 문서:

- `docs/todo/todo.md`
- `docs/architecture/docs-blog-improvement-roadmap.md`

반영 내용:

- infra/tooling에 search API contract / payload failure observability 과제 추가
- design 영역에 search highlight visual refinement 과제 추가
- roadmap의 quality gates 현황과 다음 보강 후보를 현재 코드 기준으로 업데이트

## Follow-Up

다음 실제 구현 후보:

1. `/api/search` contract를 page-level preview와 공통 helper로 맞출지 검토
2. payload parse failure observability 형식 정의
3. highlight token 시안 조정
