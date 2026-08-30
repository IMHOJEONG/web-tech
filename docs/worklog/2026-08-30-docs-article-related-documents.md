# Docs Article Related Documents

Date: 2026-08-30

## Context

상세 문서에 `이전 문서` / `다음 문서`와 `마지막 업데이트`를 추가했지만, 이는 시간 흐름 기반 이동이다.

사용자가 한 글을 읽은 뒤 같은 주제의 다른 글로 자연스럽게 이동하려면 의미 기반 추천 영역이 별도로 필요하다.

## Decision

`/docs/...` 상세 하단에 `함께 읽으면 좋은 문서` 영역을 추가한다.

추천 기준은 아래 우선순위로 계산한다.

- 겹치는 `tags`
- 같은 `topicLabel`
- 같은 section

동일 문서와 canonical href가 중복되는 문서는 제외한다.

## Implementation

- `buildArticleRelatedDocuments()` 순수 함수를 추가했다.
- 추천 함수는 최대 3개 문서를 반환한다.
- `/docs/category/...` 계열은 단순히 `category`로 묶지 않고 `category/{main}/{sub}` 단위로 section을 계산한다.
- UI는 `ArticleRelatedDocuments` 컴포넌트로 분리했다.
- 실제 `/docs/...` route page에서는 `ArticleReadingNavigation`과 같은 문서 목록을 재사용한다.
- 로컬 문서 상세에서는 원격 index를 다시 호출하지 않는 기존 결정을 유지한다.
- 문구는 `articleDetail.relatedDocuments` namespace로 `ko/en` 메시지에 연결했다.

## Verification

- 태그가 겹치는 문서가 우선 추천되는지 검증한다.
- 현재 문서와 관련 없는 문서는 제외되는지 검증한다.
- canonical href가 중복되는 문서를 하나만 남기는지 검증한다.
- 추천 결과 개수 제한이 동작하는지 검증한다.

## Follow-Up

- 추천 근거를 UI에 직접 노출할지 검토한다.
- `series`, `difficulty`, `reviewedAt` 같은 taxonomy가 추가되면 추천 점수에 반영한다.
- feedback entry point는 공개 운영 정책을 먼저 정한 뒤 추가한다.
