# Docs Content Routing Policy

## Purpose

`apps/docs`의 공개 문서 URL과 원격 콘텐츠 메타 규칙을 고정한다.

핵심 목표:

- 공개 URL이 채널 구조를 드러내도록 한다.
- `slug`, `id`, `markdownPath`의 역할을 분리한다.
- 같은 leaf slug가 여러 채널에 있어도 충돌하지 않게 한다.

## Public Route Rule

문서 상세 공개 URL은 아래 형태를 기본으로 사용한다.

```txt
/docs/{channel}/{articleSlug}
```

예:

- `/docs/feed/pna`
- `/docs/web/rendering-pipeline`
- `/docs/ui-ux/blocked-aria-hidden`
- `/docs/mobile/touch-targets`

추가 기준:

- `/feed`, `/web`, `/mobile`, `/ui-ux`
  - 허브/인덱스/큐레이션 라우트
- `/docs/{channel}/{articleSlug}`
  - 상세 canonical route

즉 채널 페이지와 상세 페이지는 역할을 분리한다.

## Field Semantics

`markdownPath`

- 콘텐츠 저장 위치를 나타내는 상대 경로
- 확장자 제외
- 예: `feed/pna`, `web/rendering-pipeline`

`slug`

- leaf slug만 사용
- 채널 prefix를 다시 넣지 않음
- 좋은 예: `pna`
- 나쁜 예: `feed-pna`

`id`

- 전역 유일 식별자
- `markdownPath` 그대로 쓰는 방식을 권장
- 예: `feed/pna`, `web/rendering-pipeline`

## Naming Rules

- `channel`은 `feed`, `web`, `mobile`, `ui-ux` 중 하나를 사용한다.
- `articleSlug`는 lowercase kebab-case를 기본으로 한다.
- `slug`에는 채널 prefix를 중복하지 않는다.
- React key나 리스트 dedupe에는 `href`보다 `id`를 우선 사용한다.

## Canonical Source Rule

공개 상세 route 계산의 canonical source는 `markdownPath`다.

우선순위:

1. `markdownPath`
2. `fileName` 기반 channel mapping
3. `slug`

의미:

- `slug`는 사람이 읽는 leaf 값이다.
- `markdownPath`는 저장 구조와 공개 route를 연결하는 구조적 식별자다.
- 같은 `slug`가 다른 channel에 존재해도 `markdownPath`가 다르면 충돌하지 않는다.

## Redirect / Alias Rule

허용 가능한 alias가 있더라도 canonical URL은 하나로 수렴해야 한다.

예:

- legacy slug-only route
- old duplicated leaf route
- 과거 channel prefix가 중복된 route

이 경우에도 최종 공개 기준은 `/docs/{channel}/{slug}`로 유지한다.

## Backend Contract

권장 응답 예:

```json
{
  "id": "feed/pna",
  "slug": "pna",
  "title": "PNA",
  "summary": "Protocol notes.",
  "markdownPath": "feed/pna"
}
```

이때:

- 본문 API: `/posts/feed/pna`
- 공개 상세 URL: `/docs/feed/pna`

## Frontend Mapping

`apps/docs`는 아래 우선순위로 공개 route path를 계산한다.

1. `markdownPath`
2. `fileName` 기반 channel mapping
3. `slug`

즉 `slug`는 마지막 fallback이고, 공개 URL의 주 source는 `markdownPath`다.

## Decision Summary

1. 채널 허브와 상세 route는 역할을 분리한다.
2. 상세 canonical URL은 `/docs/{channel}/{slug}`로 고정한다.
3. `markdownPath`를 상세 route의 주 source로 사용한다.
4. `slug`는 leaf slug만 사용하고 channel prefix를 중복하지 않는다.
