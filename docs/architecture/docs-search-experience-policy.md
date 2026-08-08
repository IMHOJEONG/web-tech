# Docs Search Experience Policy

## Purpose

이 문서는 `apps/docs`의 검색 경험을 어떤 목표와 기준으로 설계할지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- 검색은 어떤 페이지에서 어떤 방식으로 동작해야 하는가
- 제목, 요약, 분류, 본문 중 어디까지 검색 범위로 볼 것인가
- 검색 결과가 없을 때는 무엇을 보여줘야 하는가
- 추천 검색어는 어떤 기준으로 구성해야 하는가

## Core Decision

현재 `docs` 앱의 검색 경험은 아래처럼 정의합니다.

1. 별도 `/search` 라우트를 두지 않는다.
2. 검색 결과는 `/docs?q=...` 상태에서 보여준다.
3. `q`가 없으면 `/docs`는 전체 문서 인덱스 화면이다.
4. `q`가 있으면 `/docs`는 검색 결과 화면으로 동작한다.

즉, 검색은 독립된 앱이 아니라 `docs` 탐색 흐름 안에 통합된 경험으로 본다.

## Why

이 구조를 선택하는 이유는 다음과 같습니다.

- 사용자가 “문서를 둘러보는 흐름”과 “문서를 찾는 흐름”을 같은 맥락 안에서 오갈 수 있다.
- 별도 검색 페이지를 만들지 않아도 URL 상태만으로 검색 결과를 공유할 수 있다.
- `Feed`의 큐레이션 역할과 `Docs`의 인덱스 역할을 분리한 상태로 검색을 얹을 수 있다.

## Search Goals

검색은 아래 두 가지 목적을 우선 만족해야 합니다.

1. 정확한 주제를 빠르게 찾게 한다.
   - 예: `React`, `Astro`, `ARIA`, `V8`

2. 비슷한 문서를 다시 탐색하게 한다.
   - 예: 검색 결과가 없더라도 추천 검색어와 허브 이동으로 이어지게 한다.

검색은 “모든 텍스트를 훑는 기술 기능”보다, “관련 문서를 찾고 다음 읽을 것을 고르게 하는 탐색 기능”에 더 가깝게 설계합니다.

## Search Scope

권장 검색 범위는 아래와 같습니다.

### Primary Scope

가장 높은 우선순위로 검색해야 하는 필드입니다.

- `title`
- `summary`

이유:

- 사용자의 검색 의도와 가장 직접적으로 연결된다.
- 결과 품질이 가장 안정적이다.

### Secondary Scope

탐색 보조 역할로 포함할 필드입니다.

- `slug`
- `fileName` 기반 분류 토큰
- 메인/서브 카테고리에서 유추 가능한 토픽명
- 섹션명 (`Web`, `UI/UX`, `Computer Science` 등)

이유:

- 사용자가 정확한 제목보다 주제명이나 분류명으로 찾는 경우를 보완한다.

### Tertiary Scope

보조적으로 포함하되, 관련도 판단은 약하게 가져가야 하는 필드입니다.

- `content`

이유:

- 본문까지 강하게 열면 노이즈가 많아진다.
- 문서형 콘텐츠는 길이가 길어 검색 품질이 쉽게 흐려질 수 있다.

## Ranking Principle

초기 검색 결과 정렬 원칙은 아래처럼 둡니다.

1. 최신 문서 우선
2. 제목/요약/분류에 매치된 문서 우선
3. 본문만 매치된 문서는 뒤로

현재 구현 기준은 아래와 같습니다.

- `title` exact / prefix / includes match를 가장 강하게 반영한다.
- `summary` match는 그 다음 우선순위로 반영한다.
- `section`, `slug`, `fileName` 기반 taxonomy match는 보조 점수로 반영한다.
- `content` match는 약한 점수만 부여한다.
- multi-token query는 각 토큰이 문서 어딘가에 모두 존재할 때만 결과로 인정한다.
- score가 같으면 최신 문서를 먼저 보여준다.

다음 단계 목표는 아래와 같습니다.

- 검색 결과 카드의 excerpt highlight
- typo tolerance
- tag metadata 정식 반영
- 운영 로그 기반 relevance tuning

## What Not To Search First

초기 버전에서 기본 검색 대상으로 강하게 넣지 않는 항목은 아래와 같습니다.

- 코드 블록 전체
- TOC 자동 생성 텍스트
- 날짜
- author
- UI 내부 label 텍스트

이유:

- 노이즈가 빠르게 늘어난다.
- 사용자가 기대한 문서보다 우연히 단어가 포함된 결과가 앞설 수 있다.

## Search Result Screen

`/docs?q=...`는 일반 문서 목록이 아니라 검색 결과 화면처럼 보여야 합니다.

기본 `/docs`는 `Feed`와 다른 성격의 문서 인덱스 화면이어야 합니다.

검색 결과 화면에서 보여줘야 할 것:

- 검색어
- 결과 수
- 검색 기준에 대한 짧은 설명
- 추천 검색어
- 결과 카드 목록

검색 결과 화면에서 덜어내야 할 것:

- 피드 전용 큐레이션 섹션
- 허브형 장식 요소

## Empty State Policy

검색 결과가 없을 때는 “없음”으로 끝내지 않습니다.

보여줘야 할 것:

- 결과가 없다는 명확한 메시지
- 다른 키워드를 시도하라는 안내
- 추천 검색어
- 전체 문서로 돌아가는 링크

권장 문구 방향:

- 실패 메시지보다 재탐색 유도
- “검색 결과 없음”보다 “다른 주제에서 다시 시작할 수 있음” 강조

## Recommended Keywords Policy

추천 검색어는 아래 기준으로 선정합니다.

1. 현재 문서 수가 있거나 앞으로 중심이 될 핵심 주제
2. 사용자 기대가 높은 대표 키워드
3. 각 섹션의 성격을 드러내는 단어

현재 기본 추천 키워드:

- `React`
- `Astro`
- `Accessibility`
- `V8`
- `Node.js`
- `OS`

이 목록은 실제 문서 수와 운영 방향에 따라 조정할 수 있습니다.

## UX Notes

현재 검색 입력은 header 안에서 동작하지만, 결과는 `/docs?q=...`에서 확인합니다.

즉 UX 해석은:

- 입력은 global
- 결과는 docs context

이 구조는 유지하되, 사용자가 “검색이 실행되었다”는 것을 분명히 느낄 수 있도록 결과 화면을 전용 상태로 보이게 유지합니다.

## Near-Term Enhancements

가까운 시일 내 검토할 개선:

- query normalization
- typo tolerance
- 결과 카드 내 excerpt highlight
- 입력어 길이 제한과 결과 표시 문구의 더 자연스러운 요약
- keyboard-first 검색 흐름 점검

이 항목들은 검색을 기술 데모보다 실제 탐색 도구에 가깝게 만드는 역할을 한다.

## Measurement Candidates

검색 품질을 체감이 아니라 데이터로 보려면 아래를 후보로 둔다.

- zero-result query
- 추천 검색어 클릭률
- 검색 결과 클릭률
- 검색 후 허브 이탈률

초기에는 로그 수집 범위를 과도하게 넓히지 않고, `zero-result query`와 `result click` 정도부터 시작하는 편이 적절하다.

## Search API Note

현재 `/api/search`는 page와 같은 ranking / preview helper를 사용한다.

즉:

- 결과 정렬 기준
- preview title highlight
- excerpt 생성 규칙

은 API와 page가 같은 의미 체계를 유지해야 한다.

응답 contract 자체는 별도 문서에서 관리한다.

## Decision Summary

1. 검색 결과 페이지는 별도 `/search`가 아니라 `/docs?q=...` 상태로 운영한다.
2. 기본 `/docs`는 일반 피드가 아니라 전체 문서 인덱스다.
3. 검색 범위는 `title > summary > taxonomy > content` 순으로 해석한다.
4. empty state는 재탐색을 유도해야 한다.
5. 추천 검색어는 대표 주제 중심으로 운영한다.
6. 검색은 기술 기능보다 탐색 기능으로 설계한다.

## Related Docs

- [docs-search-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-search-api-contract.md)
- [docs-blog-improvement-roadmap.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-blog-improvement-roadmap.md)

## Follow-Up

- 태그 메타데이터가 생기면 검색 범위에 정식 포함
- 검색 결과 카드에 매치 문맥(excerpt highlight)이 필요한지 검토
- typo tolerance를 언제 도입할지 검토
- zero-result analytics를 운영 지표로 올릴지 검토
