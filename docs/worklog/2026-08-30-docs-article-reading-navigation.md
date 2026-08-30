# Docs Article Reading Navigation

Date: 2026-08-30

## Context

article rendering output contract를 정리한 뒤, 상세 문서에서 다음에 어떤 글을 읽을지 안내하는 UX가 부족했다.

기존 상세 페이지는 본문과 TOC 중심이라 글을 읽고 난 뒤 이동 경로가 약했다.

## Decision

`/docs/...` 상세 페이지에 article reading navigation을 1차 적용한다.

- 현재 문서의 마지막 업데이트 날짜를 표시한다.
- 현재 문서보다 오래된 문서는 `previous`로 표시한다.
- 현재 문서보다 최신 문서는 `next`로 표시한다.
- 로컬 문서 상세에서는 로컬 목록만 사용해 불필요한 remote index 호출을 피한다.
- 원격 문서 상세에서는 remote 포함 목록을 사용해 운영 콘텐츠 흐름 안에서 인접 문서를 계산한다.

## Implementation

- `buildArticleReadingNavigation()` 순수 함수를 추가했다.
- canonical `/docs/...` href 기준으로 중복 문서를 제거한다.
- UI는 `ArticleReadingNavigation` 컴포넌트로 분리했다.
- `ArticleContentLayout`은 상세 본문 하단에 reading navigation을 조합한다.
- 문구는 `articleDetail.readingNavigation` namespace로 `ko/en` 메시지에 연결했다.

## Verification

- 인접 문서 계산 로직에 unit test를 추가했다.
- `updatedAt`이 없으면 `date`를 fallback으로 사용하는 케이스를 검증한다.
- 중복 canonical href가 있을 때 같은 문서가 navigation에 반복되지 않는지 검증한다.

## Follow-Up

- related posts는 단순 이전/다음보다 topic/tag 기반 추천으로 별도 확장한다.
- feedback entry point는 공개 운영 정책을 먼저 정한 뒤 추가한다.
