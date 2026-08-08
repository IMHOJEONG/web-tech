# Docs Search API Contract

## Purpose

이 문서는 `apps/docs`의 `/api/search` 응답 contract를 정리한다.

목표:

- page rendering과 API consumer가 같은 검색 결과 의미 체계를 쓰게 한다.
- ranking / preview / count 계산 기준을 route handler 바깥에서 공통 helper로 고정한다.
- 이후 search consumer가 늘어나도 응답 형태를 안정적으로 유지한다.

## Current Route

- endpoint: `/api/search`
- method: `GET`
- query param: `q`

예시:

```text
/api/search?q=react+suspense
```

## Response Shape

현재 응답 shape:

```json
{
  "query": "react suspense",
  "count": 2,
  "results": [
    {
      "id": "feed/react-suspense-guide",
      "title": "React Suspense Guide",
      "summary": "A guide for suspense boundaries and streaming UI.",
      "content": "React suspense boundaries and async rendering.",
      "slug": "react-suspense-guide",
      "fileName": "feed/react-suspense-guide",
      "href": "/docs/feed/react-suspense-guide",
      "section": "Docs",
      "preview": {
        "titleHtml": "React <mark class=\"search-highlight\">Suspense</mark> Guide",
        "excerptHtml": "A guide for <mark class=\"search-highlight\">suspense</mark> boundaries..."
      }
    }
  ]
}
```

## Field Semantics

### `query`

- trimmed search keyword
- empty string 가능
- page와 API에서 같은 normalize 기준을 사용

### `count`

- `results.length`와 같은 값
- consumer가 별도 count 계산을 다시 하지 않아도 되게 한다

### `results`

각 item은 `SearchData` + `preview` 구조다.

기본 metadata:

- `id`
- `title`
- `summary`
- `content`
- `slug`
- `fileName`
- `date`
- `thumbnail`
- `href`
- `section`

추가 preview:

- `preview.titleHtml`
- `preview.excerptHtml`

## Ranking Rules

응답의 `results` 순서는 이미 ranking이 반영된 결과여야 한다.

현재 기준:

- `title` exact / prefix / include match 최우선
- `summary` match 차순위
- `section`, `slug`, `fileName` taxonomy match 보조 반영
- `content` match는 약한 점수
- score 동점이면 최신 문서 우선

즉 consumer는 응답을 다시 정렬하지 않는 것을 기본 원칙으로 한다.

## Preview Rules

preview는 page와 API가 같은 helper를 사용한다.

현재 기준:

- title은 keyword를 highlight 한다
- summary에 match가 있으면 summary 기반 excerpt를 만든다
- summary에 match가 없으면 content에서 context excerpt를 만든다
- HTML escape 후 highlight marker를 삽입한다

이 규칙은 `page`와 `API`가 반드시 동일해야 한다.

## Stability Rules

이 contract를 바꿀 때는 아래를 같이 고려한다.

1. `/docs?q=...` page가 같은 helper를 쓰는가
2. API consumer가 기존 `results[*].preview`에 의존하고 있는가
3. ranking 규칙 변경이 응답 order를 깨는가
4. preview HTML class 변경이 consumer styling을 깨는가

## Non-Goals

현재 contract에서 아직 다루지 않는 것:

- typo tolerance metadata
- score raw value 노출
- highlight range offset 노출
- pagination
- contract version field

필요할 때만 추가한다.

## Related Docs

- [docs-search-experience-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-search-experience-policy.md)
- [docs-blog-improvement-roadmap.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-blog-improvement-roadmap.md)
