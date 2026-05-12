# 2026-05-05 Docs Design Token Unification

## 요약

`docs` 앱에서 반복되던 하드코딩 색상, radius, shadow를 공용 토큰 유틸로 1차 흡수했다.

이번 단계의 핵심은 “모든 임시 값을 제거”가 아니라 “반복되는 surface / action / focus 기준을 shared token 계층으로 올리는 것”이었다.

## 갱신한 공용 유틸

[packages/tailwind-config/shared-styles.css](/Users/coder/Desktop/project/web-tech/packages/tailwind-config/shared-styles.css:443)

- `ds-card`에 `focus-visible` glow 추가
- `ds-button-primary`, `ds-button-secondary`에 `focus-visible` glow 추가
- `ds-panel` 추가
- `ds-panel-muted` 추가
- `ds-outline-button` 추가
- `ds-chip-muted` 추가
- `ds-focus-ring` 추가

## 적용 화면

- [apps/docs/widgets/m/ui/main-feed.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/m/ui/main-feed.tsx:1)
- [apps/docs/widgets/docs-index/ui/docs-index.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/docs-index/ui/docs-index.tsx:1)
- [apps/docs/widgets/article-detail/ui/article-detail.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/article-detail/ui/article-detail.tsx:1)
- [apps/docs/widgets/about-us/ui/about-us.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/about-us/ui/about-us.tsx:1)
- [apps/docs/feature/search/ui/search.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/feature/search/ui/search.tsx:1)
- [apps/docs/app/category/page.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/app/category/page.tsx:1)
- [apps/docs/app/category/[main]/page.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/app/category/[main]/page.tsx:1)
- [apps/docs/app/category/[main]/[sub]/page.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/app/category/[main]/[sub]/page.tsx:1)
- [apps/docs/widgets/content-hub/ui/hub-page.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/content-hub/ui/hub-page.tsx:1)
- [apps/docs/entities/category/ui/main-category-card.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/entities/category/ui/main-category-card.tsx:1)
- [apps/docs/entities/category/ui/category-document-card.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/entities/category/ui/category-document-card.tsx:1)
- [apps/docs/entities/category/ui/sub-category-card.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/entities/category/ui/sub-category-card.tsx:1)

## 메모

- `MainFeed`의 카드 액션, 필터 버튼, newsletter shell을 공용 토큰으로 교체했다.
- `DocsIndex`의 hero panel, stat block, result card를 공용 panel/card 계층으로 교체했다.
- `ArticleDetail`의 newsletter / code block / sidebar link focus를 공용 shell과 focus 기준으로 맞췄다.
- `AboutUs`의 profile action link와 card radius 중복을 정리했다.
- search submit / input의 focus-visible 표현을 token 기준으로 맞췄다.
- `category` 계열의 hero panel, topic chip, summary block, document card도 같은 panel/card/chip 계층으로 정리했다.
- `content-hub`의 hero / stat / latest 섹션도 같은 token 계층으로 맞췄다.

## 남은 예외

- 일부 topic accent color
- 일부 decorative gradient / hero composition
- device mockup frame처럼 실제 장식 의도가 강한 값

이 값들은 바로 제거하지 않고, 후속 범위에서 “semantic accent token” 또는 “decorative exception”으로 분리 검토한다.
