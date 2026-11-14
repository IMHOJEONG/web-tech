# Docs Search API Contract

## Purpose

이 문서는 `apps/docs`의 `/api/search` 응답 contract를 정리한다.

목표:

- page rendering과 API consumer가 같은 검색 결과 의미 체계를 쓰게 한다.
- ranking / preview / count 계산 기준을 route handler 바깥에서 공통 helper로 고정한다.
- 이후 search consumer가 늘어나도 응답 형태를 안정적으로 유지한다.

## 본문 검색과 원본 선택

2026-10-26 로컬 구현에서 원격 목록의 `searchText`를 검색용 `SearchData.content`에 연결했다. 로컬은 기존 공개 MDX의 본문 인덱스를 유지하며 두 소스 모두 기존 ranking·preview를 사용한다. 문서 metadata의 렌더링용 `content`는 이 필드와 별개다. 같은 URL은 원격 published 글 하나만 선택하고 과거 로컬 본문은 합치지 않는다.

원격 필드가 누락/null/빈 문자열인 구형 생산자는 제목·요약 등 metadata만 검색한다. 원격 요청/스키마 오류 때는 로컬 본문 검색으로 대체한다. 원격에서 빠진 route의 로컬 published 글은 기존 fallback 정책대로 남으며 원격 draft를 통해 로컬 글을 삭제하는 계약은 아니다. 검색 중 문서 상세를 일괄 조회하지 않는다. title > summary > taxonomy > content 순위와 HTML escape·40 code point 입력 규칙은 바꾸지 않는다.

현재 TTL·태그·인증된 게시 갱신 웹훅을 유지한다. 모의 응답의 V1→V2 검사는 새 목록을 읽은 뒤의 검색 갱신만 증명하며 실제 NAS 변경·Vercel 무효화 검증을 대체하지 않는다. [ADR-0019](adr-0019-remote-body-search.md)와 [로컬 검증](../verification/content/2026-10-26-remote-body-search.md)을 따른다.

## Current Route

원격 인덱스 입력 `GET /api/posts`는 [목록 byte budget](blog-content-api-contract.md#목록-응답-크기-제한)을 적용한다. 상한 초과는 부분 검색 성공이 아니라 기존 원격 실패/로컬 fallback 경로다. 이1MiB는 아래 공개 `/api/search` 결과 자체의 상한을 뜻하지 않는다.

- endpoint: `/api/search`
- method: `GET`
- query param: `q`

예시:

```text
/api/search?q=react+suspense
```

## Response Shape

아래 형태와 count 의미는 기존 `/api/search`의 계약이다. Drawer용 경량 endpoint와 혼동하지 않는다.

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

- [공통 입력 계약](adr-0007-search-input-contract.md)에 따라 정규화한 실제 검색어: 첫 q 값, 공백 정리, NFC, 최대 40 code point
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

## Drawer 자동완성 endpoint

2026-11-14 로컬 구현이며 운영 미배포다. `GET /api/search/suggestions?q=...`는 같은 입력 정규화와 `getSearchData` 관련도를 사용한다. 기존 `/api/search`의 응답·consumer는 변경하지 않는다.

- `query`: 실제 적용한 정규화 검색어.
- `count`: 전체 일치 수. 최대 8개인 `results.length`와 다를 수 있다.
- `results`: `id`, `href`, `title`(최대160 code point), `summary`(최대180 code point), `section`, 선택적 `readMinutes`. 본문·preview HTML·출처 정보는 전송하지 않는다.
- `suggestions`: 기존 추천어와 상위8개 문서 태그에서 중복 제거·검색어 포함 비교로 최대5개. 오타 자동 교정이나 인기 순위가 아니다.
- 빈 q는 최근 문서를 최대8개 보여주며, 반복 q는 첫 값만 사용한다. 원격 실패 시 기존 로컬 fallback을 유지한다.
- 응답은 `Cache-Control: no-store`이며 서버 내부 검색 인덱스의 기존 캐시·게시 갱신 정책은 유지한다. 클라이언트는 응답 형태와 현재 query를 확인하고 잘못된 응답도 재시도 가능한 오류로 처리한다.
- 공개 문서의 읽기 전용 endpoint다. 접근 로그에 GET 검색어가 남을 수 있으며 인증·rate limit·원격 장애 SLA를 이번 변경에서 새로 보장하지 않는다.

[설계 결정](adr-0031-docs-search-drawer.md)과 [검증](../verification/accessibility/2026-11-14-search-drawer.md)을 참고한다.

## Related Docs

- [docs-search-experience-policy.md](docs-search-experience-policy.md)
- [docs-blog-improvement-roadmap.md](docs-blog-improvement-roadmap.md)
