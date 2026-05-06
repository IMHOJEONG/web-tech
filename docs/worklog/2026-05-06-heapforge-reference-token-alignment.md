# 2026-05-06 HeapForge Reference Token Alignment

## Reference

사용자 제공 레퍼런스:

- `/Users/coder/Downloads/heapforge-blog.zip`

확인한 핵심 스타일 특성:

- light-first white / zinc 기반 surface
- dark mode에서도 cyan/purple보다 neutral zinc + orange accent
- accent는 `orange-500` 중심
- navigation / CTA / selection은 단순하고 선명한 대비

## Applied Direction

현재 `docs` 앱의 공용 토큰을 위 레퍼런스에 더 가깝게 재정렬했다.

변경 대상:

- [packages/tailwind-config/shared-styles.css](/Users/coder/Desktop/project/web-tech/packages/tailwind-config/shared-styles.css:1)
- [apps/docs/widgets/app-shell/ui/header.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/app-shell/ui/header.tsx:1)
- [apps/docs/widgets/app-shell/ui/navigation.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/app-shell/ui/navigation.tsx:1)
- [apps/docs/widgets/app-shell/ui/footer.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/app-shell/ui/footer.tsx:1)
- [apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx:1)
- [apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx:1)
- [apps/docs/feature/search/empty-search-result.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/feature/search/empty-search-result.tsx:1)

## Token Changes

- `primary`: cyan 계열 -> orange accent
- `secondary`: purple 계열 -> neutral zinc 계열
- `surface` 계층: blue-tinted light surface -> white / zinc-neutral surface
- `border` / `outline`: low-contrast blue-gray -> neutral gray
- `shadow-glow-primary`: cyan glow -> orange glow

## Shell Changes

- header를 dark hardcoded bar에서 `popover` 기반 shell로 변경
- navigation active / hover 상태를 `primary` 기준으로 변경
- footer를 black block에서 `surface-container-low` 기반으로 변경
- mobile drawer / bottom nav도 같은 neutral + orange accent 기준으로 정렬

## Notes

이번 변경은 “HeapForge 레퍼런스의 토큰 성격을 현재 docs 구조에 이식”하는 작업이다.

즉, 페이지 구조나 카피를 레퍼런스와 동일하게 바꾼 것은 아니고:

- 공용 색상 계층
- shell 상호작용 톤
- accent 사용 방식

을 레퍼런스 쪽으로 더 가깝게 맞춘 단계다.
