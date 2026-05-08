# Docs Feed And Docs Routing Policy

## Purpose

이 문서는 `apps/docs`에서 `/feed`와 `/docs`를 어떻게 구분해서 운영할지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- `/feed`와 `/docs`는 왜 분리되어야 하는가
- 두 라우트는 각각 무엇을 보여줘야 하는가
- 같은 데이터 소스를 써도 되는가
- 검색은 왜 `/docs?q=...`에 붙는가

## Core Decision

`/feed`와 `/docs`는 같은 목적의 페이지가 아닙니다.

- `/feed`는 사용자-facing 큐레이션 피드
- `/docs`는 문서 인덱스 및 검색 컨텍스트

즉 두 라우트는:

- 일부 같은 문서 데이터를 사용할 수는 있지만
- 같은 화면과 같은 역할을 가져서는 안 됩니다

## Routing Diagram

```mermaid
flowchart TD
    A[User Entry] --> B[/feed]
    A --> C[/docs]
    A --> D[/docs?q=keyword]

    B --> E[Curated Reading Flow]
    C --> F[Document Index]
    D --> G[Search Result Context]

    E --> H[Article Detail]
    F --> H
    G --> H
```

## Why They Must Be Separate

현재 둘이 같아 보이면 다음 문제가 생깁니다.

1. 사용자가 라우트 차이를 이해할 수 없다.
   - `/feed`와 `/docs`가 같은 목록이면 URL만 다르고 목적은 같아진다.

2. 검색 컨텍스트가 흐려진다.
   - `/docs?q=...`는 검색 결과 화면이어야 하는데,
   - 기본 `/docs`가 `Feed`와 동일하면 검색 결과가 단지 “피드 변형”처럼 보인다.

3. 정보구조 기준이 약해진다.
   - `Feed`는 탐색/발견
   - `Docs`는 인덱스/검색
   - 이 차이가 무너지면 IA 전체 설명력이 떨어진다.

## Quick Comparison

| Route         | Primary Goal    | User Question              | Recommended Layout                                                 | What To Avoid                                 |
| ------------- | --------------- | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| `/feed`       | 발견과 큐레이션 | “지금 무엇을 읽으면 좋지?” | featured, curated blocks, latest updates, editorial grouping       | flat index only, search-result style copy     |
| `/docs`       | 전체 문서 접근  | “전체 문서를 어떻게 찾지?” | searchable index, fast-scan card list, filters, metadata           | oversized hero, editorial storytelling blocks |
| `/docs?q=...` | 검색 결과 확인  | “이 키워드와 맞는 문서는?” | result count, query state, recommended keywords, clean result list | feed-style curation, unrelated promo sections |

## Route Roles

### `/feed`

역할:

- 지금 볼만한 문서를 발견하게 하는 메인 피드

핵심 사용자 질문:

- “최근에 올라온 글은 뭐지?”
- “운영자가 지금 보여주고 싶은 글은 뭐지?”
- “어디부터 읽으면 좋지?”

보여줘야 할 것:

- featured article
- curated sections
- latest updates
- editor-picked or highlighted content
- 읽기 흐름을 제안하는 덩어리형 레이아웃

보여주지 말아야 할 것:

- 검색 전용 헤더
- 문서 인덱스형 단순 목록만 반복되는 화면
- “모든 문서를 빠짐없이 찾는” 목적의 메타 정보

### `/docs`

역할:

- 전체 문서를 찾고 고르는 문서 인덱스
- 검색 결과를 보여주는 컨텍스트

핵심 사용자 질문:

- “전체 문서를 한 번에 보고 싶다”
- “검색어에 맞는 글이 뭐가 있지?”
- “큐레이션보다 문서 전체를 빠르게 훑고 싶다”

보여줘야 할 것:

- 문서 카드 리스트
- 검색 결과 상태
- 결과 수, 검색어, 추천 검색어
- 필터/정렬이 생긴다면 그 컨트롤

보여주지 말아야 할 것:

- 메인 피드용 hero 연출
- 과한 큐레이션 블록
- 피드 전용 편집 구성

## Content Composition Guide

### `/feed` Composition

권장 순서:

1. 진입용 hero 또는 featured story
2. editor-picked / highlighted section
3. latest updates
4. theme-based grouped content
5. secondary links to `Web`, `Mobile`, `UI/UX`

이 페이지는 “전체 문서를 빠짐없이 보여주는 것”보다, 지금 읽을 가치가 높은 흐름을 보여주는 것이 더 중요합니다.

### `/docs` Composition

권장 순서:

1. 짧은 index intro
2. search state or search input context
3. 전체 문서 리스트
4. 메타데이터 기반 빠른 스캔 요소
5. empty state or recommended keyword guidance

이 페이지는 “무드”보다 “탐색 효율”이 중요합니다.

## URL Policy

정책은 아래처럼 둡니다.

- `/feed`
  - 큐레이션 피드
- `/docs`
  - 전체 문서 인덱스
- `/docs?q=keyword`
  - 검색 결과 화면
- `/docs/[channel]/[articleSlug]`
  - 일반 문서 상세
- `/category/...`
  - taxonomy 기반 탐색 및 상세

## Data Policy

같은 원문 데이터 소스를 두 라우트에서 공유하는 것은 괜찮습니다.

예:

- 둘 다 `getSortedPostsData()` 같은 공통 문서 소스를 참조 가능

하지만 표현 방식은 달라야 합니다.

### `/feed` 데이터 해석

- 최신성
- 큐레이션 우선순위
- 강조할 문서
- 읽기 흐름

### `/docs` 데이터 해석

- 전체 문서 접근성
- 검색 가능성
- 인덱스 역할
- 빠른 스캔

즉:

- `same source`
- `different presentation`
- `different user task`

## Search Placement

검색 결과를 `/docs?q=...`에 두는 이유는 다음과 같습니다.

- 검색은 문서 인덱스 경험과 더 잘 맞는다
- `/feed?q=...`는 큐레이션 피드 개념과 충돌하기 쉽다
- `/docs`는 “전체 문서를 다루는 컨텍스트”이므로 검색 결과가 자연스럽다

따라서:

- global search input
- results in `/docs?q=...`

이 구조를 유지합니다.

## Display Criteria

이 문서는 이후 화면 설계 시 아래 기준으로 사용합니다.

### `/feed`에서 우선 노출할 정보

- 최신성
- 운영자가 강조하고 싶은 문서
- 읽기 흐름 또는 시리즈 맥락
- 섹션 간 연결성

### `/docs`에서 우선 노출할 정보

- 문서 제목
- 요약
- 날짜
- section/category 정보
- 검색 결과 여부

### `/feed`에서 약하게 둘 정보

- exhaustive index 성격의 메타데이터
- 검색 상태 설명
- 너무 촘촘한 taxonomy 노출

### `/docs`에서 약하게 둘 정보

- editorial voice가 강한 hero
- large campaign-like visual sections
- discovery보다는 indexing과 관계없는 장식 요소

## Relationship To IA

이 정책은 정보구조 문서와 이렇게 연결됩니다.

- `Feed`는 user-facing IA의 대표 허브
- `Docs`는 user-facing 메인 허브가 아니라 문서 인덱스 컨텍스트
- `Category`는 taxonomy 허브

즉 `Feed / Web / Mobile / UI/UX / About`가 메인 IA를 구성하고,
`/docs`는 그 위에 별도 허브를 하나 더 추가하는 것이 아니라 문서 접근 레이어로 봅니다.

## Current Gap

현재 구현상 `/docs`가 `/feed`와 비슷한 데이터를 보여줄 수는 있지만,
장기적으로는 아래처럼 차이를 더 분명히 해야 합니다.

목표 상태:

- `/feed`: 편집된 피드 경험
- `/docs`: 검색/인덱스 경험

필요한 후속 작업:

- `/docs` 전용 intro 또는 index copy
- `/feed` 전용 큐레이션 구조 강화
- `/docs`에서 검색/문서 목록 중심 레이아웃 강화

## Decision Summary

1. `/feed`와 `/docs`는 분리한다.
2. `/feed`는 큐레이션 피드다.
3. `/docs`는 문서 인덱스 및 검색 컨텍스트다.
4. 두 라우트는 같은 데이터를 참조할 수 있지만, 같은 화면이 되어서는 안 된다.
5. 검색 결과는 `/docs?q=...`에 둔다.
