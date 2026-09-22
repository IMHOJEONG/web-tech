# 2026-08-26 Docs Layout And List Motion

## 배경

반응형 breakpoint 전환과 검색/필터/페이지네이션으로 카드 목록이 바뀌는 순간이 다소 딱딱하게 느껴질 수 있었다.

초기 도입은 별도 animation library 없이 CSS 기반으로 진행한다.

## 변경

- `apps/docs/app/css/animation.css`에 공통 motion utility를 추가했다.
  - `motion-layout`
  - `motion-reveal`
- `prefers-reduced-motion: reduce` 환경에서는 transition과 animation을 제거한다.
- `/docs`에 layout transition과 list reveal을 적용했다.
  - search panel
  - browse controls
  - stats cards
  - section summary cards
  - document list cards
  - pagination layout
- `/feed`에 list reveal을 적용했다.
  - featured card
  - compact card
  - image card
  - placeholder support card
  - filtered empty state

## 결정

- `transition-all`은 사용하지 않는다.
- 큰 레이아웃 property 자체를 억지로 애니메이션하지 않는다.
- `opacity`, `transform`, `gap`, `padding`, `border-color`, `background-color`, `box-shadow` 중심으로 제한한다.
- 전환은 느리게 느껴지는 선까지 가지 않고 `280ms ~ 360ms` 범위로 둔다.

## 검증 예정

- `pnpm --filter docs lint`
- `pnpm --filter docs typecheck`

## 관련 문서

- `docs/architecture/docs-motion-interaction-policy.md`
- `docs/runbooks/docs-responsive-browser-device-checklist.md`
