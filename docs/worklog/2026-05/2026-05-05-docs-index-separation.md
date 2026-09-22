# 2026-05-05 Docs 인덱스 분리

## 요약

- `/feed`와 `/docs`의 화면 역할 차이를 실제 구현에 반영
- `/feed`는 기존 `MainFeed` 기반 큐레이션 화면을 유지
- `/docs`는 문서 인덱스와 검색 컨텍스트 전용 레이아웃으로 분리

## 변경 내용

- `apps/docs/app/docs/page.tsx`
- `apps/docs/widgets/docs-index/ui/docs-index.tsx`
- `docs/todo/platform-improvement-todo.md`

## 메모

- 기존에는 `/docs`도 `MainFeed`를 재사용해 `/feed`와 시각적 역할 차이가 거의 없었다.
- 이번 변경으로 `/docs`는:
  - index intro
  - section overview
  - all documents list
  - search result context
    를 중심으로 구성된다.
- 이후 후속 작업으로는 `/feed` 큐레이션 밀도를 더 높이거나, `/docs`에 필터/정렬을 추가하는 방향을 검토할 수 있다.
