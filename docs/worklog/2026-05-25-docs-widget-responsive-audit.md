# 2026-05-25 Docs 위젯 반응형 점검

## Summary

- `MainFeed`, `ArticleDetail`, `AboutUs`를 `docs` 반응형 정책 기준으로 다시 점검했다.
- `640px ~ 1023px` 구간에서 콘텐츠 밀도가 너무 빨리 커지지 않도록 `sm` 사용을 줄였다.
- `sm`은 shell과 맞춘 gutter 정렬에 주로 남기고, 아래 변화는 `lg` 또는 `md`로 옮겼다.
  - 카드 패딩 확대
  - 이미지 그리드 분할
  - 작성자 메타 영역의 가로 전환
  - CTA 크기 확대

## Files

- `apps/docs/widgets/m/ui/main-feed.tsx`
- `apps/docs/widgets/article-detail/ui/article-content-layout.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail-main.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `docs/architecture/docs-responsive-policy.md`
- `docs/todo/platform-improvement-todo.md`
