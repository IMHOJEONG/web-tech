# 2026-05-05 Feed 쿼리 필터

## 요약

- `MainFeed` 필터 버튼을 `query string` 기반 인터랙션으로 연결
- `/feed?topic=web|mobile|uiux` 형태로 상태를 표현
- 왜 `client filter`나 `route transition`이 아니라 `query string`을 선택했는지 구조 문서로 정리

## 변경 내용

- `apps/docs/app/feed/page.tsx`
- `apps/docs/widgets/m/ui/main-feed.tsx`
- `docs/architecture/docs-feed-filter-policy.md`
- `docs/todo/platform-improvement-todo.md`

## 메모

- `Feed`는 큐레이션 허브로 유지하고, `topic`은 그 안의 보기 상태로 해석한다.
- 현재 mobile 관련 문서는 많지 않아서, 필터 결과가 비어 있을 때는 fallback 상태를 함께 보여준다.
- 이후에는 `sort`, `tag`, 피드 전용 큐레이션 블록 재구성까지 query string 모델 위에서 확장할 수 있다.
