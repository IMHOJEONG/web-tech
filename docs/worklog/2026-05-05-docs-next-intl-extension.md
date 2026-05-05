# Worklog: 2026-05-05 Docs Next Intl Extension

## Summary

- `docs-index`, `about-us`, `article-detail`에 남아 있던 하드코딩 UI copy를 `next-intl`로 이관
- 화면 단위 namespace로 `docsIndex`, `about`, `articleDetail`를 추가
- 기존 i18n 정책 문서도 현재 스코프에 맞게 보강

## Changed

- `apps/docs/widgets/docs-index/ui/docs-index.tsx`
- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/architecture/docs-next-intl-usage-policy.md`

## Notes

- 이번 작업은 단순 placeholder 치환이 아니라 화면 단위 카피를 namespace별로 묶는 데 목적이 있다.
- `docsIndex`는 인덱스/검색 전용 UI copy를, `about`와 `articleDetail`은 page-scope 카피를 담당한다.
- 이후 남아 있는 긴 copy 중 locale-aware metadata나 OG 문구는 별도 정책으로 확장할 수 있다.
