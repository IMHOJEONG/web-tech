# 2026-05-05 Docs 컴팩트 셸 튜닝

## 요약

- `640px ~ 1023px` 구간을 compact desktop/tablet shell로 더 명확하게 조정
- header의 중앙 navigation과 우측 search/action 충돌 가능성을 줄임
- `MainFeed`, `ArticleDetail`의 tablet spacing을 데스크톱 대비 더 촘촘하게 조정

## 변경 내용

- `apps/docs/widgets/app-shell/ui/header.tsx`
- `apps/docs/widgets/app-shell/ui/navigation.tsx`
- `apps/docs/feature/search/ui/search.tsx`
- `apps/docs/widgets/m/ui/main-feed.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `docs/architecture/docs-responsive-policy.md`
- `docs/todo/platform-improvement-todo.md`

## 메모

- 이번 작업은 실제 디바이스 실측 전 단계의 breakpoint tuning이다.
- shell 관점에서는:
  - `sm ~ lg` 구간에서 header를 absolute center 방식 대신 3-column grid로 정리
  - search input 확장 폭을 compact zone에서 더 짧게 조정
  - theme toggle은 `md`부터 노출하게 변경
- content 관점에서는:
  - `MainFeed` hero/section spacing과 card padding을 compact zone에서 소폭 축소
  - `ArticleDetail`의 top spacing, section gap, content block padding을 compact zone에 맞게 축소
- 실제 디바이스 확인이 끝나기 전까지는 TODO를 완료가 아니라 진행 중 상태로 유지한다.
