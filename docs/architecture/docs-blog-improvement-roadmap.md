# Docs Blog Improvement Roadmap

## Purpose

이 문서는 `apps/docs` 블로그의 다음 개선 단계를 한 문서에서 관리하기 위한 기준서다.

핵심 목표:

- 개선 항목을 UI 단위가 아니라 운영 모델 단위로 묶는다.
- `todo`에 흩어지기 쉬운 과제를 canonical roadmap으로 정리한다.
- 로컬 MDX, 원격 콘텐츠 API, 허브/상세 라우팅, 검색, 렌더링, 테스트의 기준을 함께 본다.

## Current Assessment

현재 `apps/docs`는 아래 강점을 이미 갖고 있다.

- 채널 허브와 상세 문서 구조가 어느 정도 분리되어 있다.
- remote content API와 local fallback 운영 경험이 축적되어 있다.
- `next-intl`, design token, article layout, search UI의 기본 틀이 있다.
- 정책성 문서가 이미 다수 존재해 후속 정리가 용이하다.

반면 다음 성격의 개선 포인트가 남아 있다.

- 메타데이터 의미 체계가 local MDX와 remote payload 사이에서 완전히 고정되지는 않았다.
- 상세 URL canonical 정책이 더 강하게 닫혀야 한다.
- 검색은 현재 “최신순 + 포함 여부 필터”에 가까워 관련도 품질 여지가 있다.
- 렌더링 품질은 좋아졌지만 local MDX와 remote HTML의 표현력 차이가 남을 수 있다.
- 회귀를 막는 테스트와 contributor guide가 아직 제품 성숙도에 비해 얇다.

## Core Decisions

### 1. Metadata First

앞으로의 블로그 개선은 UI보다 먼저 메타데이터 규칙을 고정하는 방향으로 진행한다.

이유:

- 검색 품질
- 허브 분류
- 관련 글 추천
- canonical URL
- authoring validation

모두가 메타데이터 품질에 의존하기 때문이다.

### 2. Detail Routes Belong To `/docs`

채널 허브와 문서 상세의 책임을 더 분명히 나눈다.

- `/feed`, `/web`, `/mobile`, `/ui-ux`
  - 탐색 허브 / 큐레이션 / 인덱스
- `/docs/{channel}/{slug}`
  - 문서 상세 canonical route

즉 채널 라우트는 “목록과 탐색”, `/docs`는 “상세와 검색 컨텍스트”를 담당한다.

### 3. Search Is A Discovery Product

검색은 단순 문자열 필터가 아니라 문서 탐색 기능으로 본다.

따라서 검색 품질 판단 기준은:

- 정확한 주제를 빨리 찾게 하는가
- 다음 읽을 문서를 연결하는가
- 0건 검색에서도 막히지 않는가

이다.

## Priority Roadmap

### P1. Metadata Schema Fixation

고정할 필드:

- `id`
- `slug`
- `title`
- `summary`
- `date`
- `updatedAt`
- `markdownPath`
- `thumbnail`
- `authorName`
- `authorRole`
- `readMinutes`
- `topicLabel`
- `tags`
- `status`

원칙:

- local MDX frontmatter와 remote API payload는 같은 의미 체계를 사용한다.
- `markdownPath`는 저장 위치이자 상세 route 계산의 기준 source다.
- `slug`는 leaf slug만 사용한다.
- `id`는 전역 유일 식별자로 `markdownPath`를 우선 권장한다.

### P1. Canonical Routing Hardening

강화할 기준:

- 상세의 canonical URL은 항상 `/docs/{channel}/{slug}`다.
- `/feed`, `/web`, `/mobile`, `/ui-ux`는 상세 본문을 직접 대표하지 않는다.
- alias나 legacy route는 허용하더라도 canonical은 한 곳으로 수렴한다.
- route 계산에서 `slug`는 최후 fallback이고, 기본 source는 `markdownPath`다.

### P1. Search Quality Upgrade

다음 단계 검색 기준:

- `title` match 최우선
- `summary`와 taxonomy match 차순위
- `content` match는 보조 점수
- 최신성은 동점 조정 요소

추가 검토:

- query normalization
- typo tolerance
- excerpt highlight
- zero-result analytics
- recommended keyword refresh rule

### P1. Quality Gates And Tests

최소 자동화 범위:

- path normalization 유닛 테스트
- route mapping 유닛 테스트
- remote payload schema validation 테스트
- `/docs?q=...` 검색 스모크 테스트
- 상세 문서 렌더링 스모크 테스트

이 단계가 완료되어야 이후 taxonomy 확장이나 콘텐츠 스케일업을 안전하게 진행할 수 있다.

현재 완료 범위:

- route mapping / canonical redirect test
- editorial metadata normalize / validation test
- remote payload container + field-level schema validation test
- remote payload schema failure structured logging
- search relevance ranking test
- search result preview / highlight shared helper
- `/api/search` 응답 contract에 shared preview 규칙 반영
- docs detail render smoke test
- `/docs?q=...` search state smoke test
- `docs` 전용 `test:lib`, `test:content` CI 연결

다음 보강 후보:

- remote payload parse failure를 실제 alerting / error aggregation과 연결할지 결정
- search API consumer가 늘어날 경우 contract versioning이 필요한지 검토
- search preview highlight의 visual tuning을 더 세밀하게 조정할지 검토

### P1. Contributor Guide

콘텐츠 운영 문서에 반드시 포함할 항목:

- 새 글 작성 위치
- frontmatter 규칙
- channel/slug naming 규칙
- 이미지 저장 위치
- publish 전 검증 항목
- remote content contract와 관계

현재 `apps/docs/README.md`는 메모 성격이 강하므로, contributor-facing 문서는 architecture 또는 runbook 기준으로 보강한다.

## Medium-Term Candidates

### Rendering Convergence

local MDX와 remote HTML/markdown 사이의 표현 차이를 더 줄인다.

관심 항목:

- callout
- figure / figcaption
- code block
- heading anchor
- table / list / blockquote 스타일

필요 시 remote content도 markdown-first 계약으로 재정렬하는 방안을 검토한다.

### Editorial Discovery Layer

문서 상세에 아래 탐색 보조를 확장할 수 있다.

- related posts
- previous / next navigation
- last updated badge
- series navigation
- quality feedback entry point

### Taxonomy Expansion

현재 채널 외에 아래 메타 확장을 검토한다.

- `tags`
- `series`
- `status`
- `difficulty`

단, taxonomy는 검색/허브/추천 모두에서 재사용 가능한 경우에만 승격한다.

### Search Telemetry

운영 관측 후보:

- zero-result query
- top query
- query to click conversion
- channel hub to article click path
- outdated article feedback

추가로 검토할 운영 신호:

- remote payload schema parse failure count
- upstream contract drift가 발생한 endpoint / field path
- search preview click-through가 실제 클릭률 개선으로 이어지는지

### Content Freshness Signals

기술 블로그 특성상 문서 최신성은 UX의 일부다.

후보:

- `updatedAt` 노출
- reviewed date
- stale candidate 판정 기준
- 업데이트가 오래된 글의 시각 표시

## Review Criteria

개선 작업은 아래 질문으로 우선순위를 판단한다.

1. 이 작업이 검색/탐색 품질을 실제로 높이는가
2. 메타데이터와 라우팅 규칙을 더 단순하게 만드는가
3. local authoring과 remote runtime 사이 책임을 더 분명히 하는가
4. 회귀 가능성을 줄이는가
5. 문서 수가 늘어도 유지 가능한 규칙인가

## Related Docs

- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [docs-content-routing-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-routing-policy.md)
- [docs-search-experience-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-search-experience-policy.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
- [docs-content-rendering-strategy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-rendering-strategy.md)
