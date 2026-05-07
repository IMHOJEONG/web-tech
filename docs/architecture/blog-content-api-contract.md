# Blog Content API Contract

## Purpose

`apps/docs`는 블로그 콘텐츠를 2단계로 가져온다.

1. 목록 API에서 메타데이터를 조회한다.
2. 개별 본문 API에서 HTML 본문을 조회한다.

이 문서는 프론트와 백엔드가 맞춰야 하는 최소 계약을 정리한다.

## Current Flow

### List API

- `GET /api/posts`

역할:

- 피드, 목록, 검색용 메타데이터 제공
- 본문 전체를 포함하지 않아도 됨

### Body API

- `GET /posts/{markdownPath}`

역할:

- 개별 문서의 렌더링된 HTML 본문 제공

## Endpoint Selection

프론트는 현재 한 번에 하나의 endpoint만 선택해서 사용한다.

우선순위:

1. `BLOG_CONTENT_API_BASE_URL_PUBLIC`
2. `BLOG_CONTENT_API_BASE_URL_INTERNAL`
3. `BLOG_CONTENT_API_BASE_URL`

본문 endpoint도 같은 방식으로 선택한다.

1. `BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC`
2. `BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL`
3. `BLOG_CONTENT_MARKDOWN_BASE_URL`

즉 `PUBLIC`과 `INTERNAL`이 동시에 있어도 둘 다 시도하지 않고, 더 우선순위가 높은 하나만 사용한다.

이렇게 하면:

- 인증 실패 후 내부망 주소까지 연쇄 호출되는 문제를 줄이고
- 로그 해석이 쉬워지고
- 배포 환경에서 실제로 사용할 endpoint가 더 분명해진다.

## Server-to-Server Auth

`apps/docs`가 다른 곳에 배포되어 있고, 콘텐츠 source endpoint를 브라우저 직접 접근에서는 막고 싶다면 `server-to-server` 인증을 붙이는 것이 권장된다.

권장 방식:

- `Authorization: Bearer <shared-secret>`

프론트 동작:

- `apps/docs` 서버 fetch에서만 토큰을 보낸다
- 브라우저에는 토큰을 절대 내려주지 않는다

백엔드 기대 동작:

- 올바른 토큰이 없으면 `401 Unauthorized` 또는 `403 Forbidden`
- 토큰이 맞을 때만 `/api/posts`, `/posts/{markdownPath}` 응답

현재 `apps/docs`는 `BLOG_CONTENT_API_TOKEN`이 있으면 목록 API와 본문 API 양쪽에 같은 Bearer 토큰을 붙인다.

## Recommended Contract

### 1. List API

#### Request

```http
GET /api/posts
Accept: application/json
Authorization: Bearer <shared-secret>
```

#### Response

```json
{
  "results": [
    {
      "id": "test",
      "slug": "test",
      "title": "Test",
      "summary": "테스트 문서",
      "date": "2026-05-01",
      "thumbnail": "/images/test.webp",
      "markdownPath": "test.md"
    }
  ]
}
```

#### Required fields

- `id`
  - 문자열 또는 숫자
  - 내부 식별자
- `markdownPath`
  - 본문 HTML을 조회할 때 사용할 경로 값

#### Strongly recommended fields

- `slug`
  - 라우팅과 공유 URL 안정성을 위해 권장
- `title`
  - 목록 카드/페이지 제목에 필요
- `summary`
  - 피드 카드 요약 문구
- `date`
  - 정렬/노출용

#### Optional fields

- `thumbnail`
- `thumbnailUrl`
- `thumbnail_url`
- `fileName`
- `path`

프론트는 현재 일부 fallback을 갖고 있지만, 운영용으로는 `slug`, `title`, `summary`, `markdownPath`를 명시적으로 주는 것을 권장한다.

### 2. Body API

#### Request

```http
GET /posts/test.md
Accept: text/html,text/plain;q=0.9,*/*;q=0.8
Authorization: Bearer <shared-secret>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

```html
<!doctype html>
<html>
  <body>
    <article>
      <h1 id="test">Test</h1>
      <p>본문 내용</p>
    </article>
  </body>
</html>
```

#### Required behavior

- `200 OK` on success
- HTML 본문 반환
- `Content-Type: text/html` 권장

#### Recommended HTML rules

- 문서 본문은 `<article>` 내부에 감싸기
- heading에는 가능한 `id` 부여
- 코드 블록은 서버에서 렌더링 규칙을 통일

## Supported Payload Shapes

프론트는 현재 아래 목록 응답 shape를 허용한다.

### Shape A

```json
[
  {
    "id": "test",
    "slug": "test",
    "title": "Test",
    "markdownPath": "test.md"
  }
]
```

### Shape B

```json
{
  "items": [
    {
      "id": "test",
      "slug": "test",
      "title": "Test",
      "markdownPath": "test.md"
    }
  ]
}
```

### Shape C

```json
{
  "results": [
    {
      "id": "test",
      "slug": "test",
      "title": "Test",
      "markdownPath": "test.md"
    }
  ]
}
```

권장 shape는 `results`를 쓰는 Shape C다.

## Current Frontend Fallbacks

현재 프론트는 테스트 편의를 위해 일부 fallback을 지원한다.

- `slug`가 없으면 `id` 또는 `markdownPath` 파일명에서 유도
- `title`이 없으면 `slug`를 사람이 읽기 쉬운 텍스트로 변환

예:

```json
{
  "results": [
    {
      "id": "test",
      "markdownPath": "test.md"
    }
  ]
}
```

이 경우 프론트는 대략 다음처럼 보정한다.

- `slug`: `test`
- `title`: `TEST`

이 fallback은 개발 편의용이다. 운영에서는 명시 필드를 내려주는 편이 안전하다.

## Search Considerations

현재 프론트 검색은 목록 API 메타데이터 기준으로 동작한다.

즉 지금 본문 전체 검색을 하려면 두 가지 중 하나가 필요하다.

1. 목록 API가 `summary` 외에 검색 가능한 텍스트를 더 제공
2. 백엔드가 별도 검색 API를 제공

권장 방향:

- 간단한 검색: `GET /api/posts?q=keyword`
- 전문 검색이 필요하면 전용 검색 API 또는 검색 엔진 도입

## Error Handling

### List API failure

- 프론트는 로컬 문서 fallback을 시도할 수 있다.
- 운영 환경에서는 에러 로깅이 필요하다.
- 토큰 보호를 쓴다면 `401/403`도 관측 가능한 failure case로 본다.

### Body API failure

- 상세 페이지는 빈 본문이 되지 않도록 `404` 또는 에러 UI로 처리하는 편이 좋다.
- 장기적으로는 `slug` 기준 상세 메타 API를 두는 것도 고려할 수 있다.
- 토큰 누락/만료/오타가 있으면 본문 endpoint도 `401/403`가 나므로 read token 관리가 필요하다.

## Recommended Production Contract

### List API

```json
{
  "results": [
    {
      "id": "test",
      "slug": "test",
      "title": "Test",
      "summary": "테스트 문서",
      "date": "2026-05-01",
      "thumbnail": "/images/test.webp",
      "markdownPath": "test.md"
    }
  ]
}
```

### Body API

- `GET /posts/test.md`
- `Content-Type: text/html`
- `<article>...</article>` 포함 HTML 반환

## Follow-up

- TOC 데이터를 백엔드가 같이 내려줄지 여부
- heading id를 서버에서 항상 보장할지 여부
- 본문 HTML sanitize 정책을 어디서 담당할지 여부
- 검색 API를 별도로 둘지 여부
