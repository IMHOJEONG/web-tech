# Docs App Top Loader Wrapper

## Context

`apps/docs/app/layout.tsx`에서 `nextjs-toploader`를 직접 렌더링하고 있었다.

기본 top-loader 색상은 현재 HeapForge 화면 톤과 맞지 않고, app shell 표현을 layout에 직접 둔 상태라 이후 조정 지점도 분산될 수 있었다.

## Change

- `AppTopLoader`를 `widgets/app-shell/ui`로 분리했다.
- top-loader 색상은 `var(--primary)` 토큰을 사용한다.
- 높이는 `2px`로 줄이고 shadow는 제거했다.
- TOC anchor 이동 같은 hash navigation에서는 top-loader가 뜨지 않도록 `showForHashAnchor={false}`로 설정했다.

## Result

top-loader는 app shell 책임으로 분리되었고, 색상/높이/동작을 한 파일에서 관리할 수 있게 되었다.
