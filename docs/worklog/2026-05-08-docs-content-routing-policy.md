# 2026-05-08 Docs Content Routing Policy

## Why

- `/docs/feed-pna`처럼 channel이 slug에 흡수된 URL은 읽기 어렵다.
- 같은 leaf slug가 여러 채널에 있을 때 `/docs/{slug}` 구조는 충돌 위험이 있다.
- root landing latest notes에서 `href` 기반 key가 중복되는 문제도 같이 드러났다.

## Decision

- 공개 상세 URL은 `/docs/{channel}/{articleSlug}`로 고정한다.
- `slug`는 leaf slug만 사용한다.
- `markdownPath`는 `channel/articleSlug` 상대 경로로 유지한다.
- `id`는 전역 유일값으로 사용하고 `markdownPath`를 권장한다.

## Applied Changes

- `apps/docs` 상세 라우트를 catch-all로 변경
- 공용 `getDocRoutePath` / `getDocHref` helper 추가
- feed, search, root landing, hub에서 같은 route helper 사용
- latest notes list key를 `href` 대신 `id`로 변경
