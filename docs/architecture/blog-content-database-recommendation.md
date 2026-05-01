# Blog Markdown DB Recommendation

이 문서는 `apps/docs/data` 같은 내부 코드 문서가 아니라, 실제 블로그에 노출될 markdown 콘텐츠를 어떤 DB에 저장할지에 대한 추천안입니다.

## 결론

기본 추천은 `PostgreSQL`입니다.

이 프로젝트 기준으로는 다음 구성이 가장 현실적입니다.

1. 원본 저장소: `PostgreSQL`
2. 검색 고도화가 필요할 때만: `Meilisearch` 추가
3. 나중에 의미 검색이 필요하면: `pgvector` 추가

즉 처음부터 DB를 여러 개 쓰기보다,

- 시작: `Postgres only`
- 검색 UX가 중요해지면: `Postgres + Meilisearch`
- AI/RAG/유사 문서 추천이 필요하면: `Postgres + pgvector (+ Meilisearch optional)`

순서로 가는 것을 권장합니다.

## 왜 Postgres인가

블로그 markdown 콘텐츠는 보통 아래 데이터를 함께 가집니다.

- `slug`
- `title`
- `summary`
- `body_markdown`
- `tags`
- `category`
- `published_at`
- `locale`
- `status`
- `author`
- `thumbnail`
- `seo metadata`

이 구조는 문서 본문만 있는 게 아니라, 정렬/필터/게시 상태/다국어/관계형 메타데이터가 같이 붙습니다.  
이런 경우에는 문서 저장소라기보다 “콘텐츠 모델”에 가깝기 때문에 Postgres가 잘 맞습니다.

장점:

- `slug`, `locale`, `published_at`, `status` 같은 메타데이터 관리가 쉽습니다.
- draft/published/scheduled 같은 워크플로우를 만들기 쉽습니다.
- 정렬, 필터링, 페이징, unique 제약을 자연스럽게 처리할 수 있습니다.
- markdown 본문은 그냥 `text` 컬럼에 저장하면 됩니다.
- 검색도 초기에는 Postgres 내장 Full Text Search로 시작할 수 있습니다.

공식 참고:

- PostgreSQL 기반 Full Text Search 개요: https://supabase.com/docs/guides/database/full-text-search
- pgvector 확장: https://supabase.com/docs/guides/database/extensions/pgvector

## 왜 MongoDB를 기본 추천으로 두지 않는가

MongoDB도 markdown 문서를 넣는 용도 자체는 가능합니다.  
다만 이 프로젝트처럼 블로그 게시물을 운영하면 결국 아래 요구가 자주 생깁니다.

- locale별 slug uniqueness
- publish workflow
- category/tag 집계
- 날짜 정렬
- related posts
- 검색 결과 랭킹

이 요구들은 document store보다 relational model에서 더 안정적으로 다루기 쉽습니다.  
이 판단은 현재 프로젝트 구조를 기준으로 한 아키텍처 inference입니다.

## 검색은 언제 Meilisearch를 붙이나

Postgres만으로도 검색은 시작할 수 있습니다.  
하지만 블로그 검색 UX가 아래 수준까지 필요해지면 Meilisearch를 붙이는 편이 좋습니다.

- typo tolerance
- prefix/autocomplete
- 빠른 relevance tuning
- 검색 결과 품질을 운영자가 쉽게 튜닝

Meilisearch 공식 문서 기준 장점:

- typo tolerance
- prefix search
- ranking rules
- 밀리초 단위 응답

공식 참고:

- Full-text search overview: https://www.meilisearch.com/docs/capabilities/full_text_search/overview
- Typo tolerance: https://www.meilisearch.com/docs/capabilities/full_text_search/relevancy/typo_tolerance_settings

## 추천 아키텍처

### 1. 가장 추천

`Postgres only`

적합한 시점:

- 아직 콘텐츠 수가 많지 않음
- 관리자 CMS가 단순함
- 검색은 제목/요약/본문 키워드 검색 정도면 충분함

추천 이유:

- 구현 복잡도가 가장 낮음
- 운영 포인트가 적음
- 나중에 확장 가능

### 2. 검색이 중요해지면

`Postgres + Meilisearch`

적합한 시점:

- 블로그 글 수가 늘어남
- 검색창 UX가 중요해짐
- 오타 허용, 자동완성, relevance 개선이 필요함

운영 방식:

- Postgres를 source of truth로 유지
- 게시물 변경 시 Meilisearch index 동기화

### 3. AI 검색/추천까지 보면

`Postgres + pgvector`

적합한 시점:

- “비슷한 글 추천”
- semantic search
- RAG

이 경우에도 source of truth는 Postgres로 유지하는 것이 좋습니다.

## 이 프로젝트 기준 추천안

현재 `apps/docs` 구조와 앞으로의 블로그 운영을 기준으로 하면:

1. 먼저 `PostgreSQL`로 간다.
2. markdown 본문은 `text`로 저장한다.
3. 메타데이터는 정규 컬럼으로 분리한다.
4. 검색은 처음엔 Postgres FTS로 구현한다.
5. 검색 UX 요구가 커질 때만 Meilisearch를 붙인다.

가장 추천하는 런칭 버전:

- DB: `PostgreSQL`
- 본문 저장: `body_markdown text`
- 검색: `Postgres Full Text Search`
- 추후 확장: `Meilisearch`, `pgvector`

## 예시 테이블

```sql
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null default 'ko',
  title text not null,
  summary text,
  body_markdown text not null,
  thumbnail_url text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index blog_posts_slug_locale_uq
  on blog_posts (slug, locale);
```

필요하면 여기에:

- `blog_post_tags`
- `blog_post_categories`
- `authors`
- `seo_title`, `seo_description`
- generated `tsvector` column

을 붙이면 됩니다.

## 최종 한 줄 추천

블로그용 markdown 저장소는 `PostgreSQL`로 시작하고, 검색 품질이 중요해질 때만 `Meilisearch`를 추가하는 것이 가장 좋은 선택입니다.
