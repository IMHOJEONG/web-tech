# Docs Motion Interaction Policy

이 문서는 `apps/docs`에서 layout transition과 list reveal animation을 어떻게 사용할지 정리한다.

## 목표

motion은 장식이 아니라 상태 변화의 방향을 알려주는 보조 수단으로 사용한다.

- 반응형 breakpoint 전환 시 UI가 갑자기 튀지 않게 한다.
- 검색, 필터, 페이지네이션으로 문서 목록이 바뀔 때 변화가 자연스럽게 보이게 한다.
- 사용자가 `prefers-reduced-motion`을 설정한 경우 애니메이션을 제거한다.

## 기본 원칙

1. `transition-all`은 기본적으로 사용하지 않는다.
2. `width`, `height`, `grid-template-*` 같은 큰 layout property 애니메이션은 피한다.
3. 허용 property는 `opacity`, `transform`, `gap`, `padding`, `background-color`, `border-color`, `box-shadow` 중심으로 둔다.
4. duration은 `200ms ~ 350ms`를 기본 범위로 본다.
5. list reveal은 짧은 stagger를 사용하되, 목록 탐색을 방해하지 않는 선에서만 적용한다.
6. `motion-reduce` 환경에서는 transition과 animation을 제거한다.

## 현재 CSS 유틸

`apps/docs/app/css/animation.css`에 아래 유틸을 둔다.

- `motion-layout`
  - breakpoint, spacing, panel tone 변화에 사용한다.
  - transition duration은 `280ms`다.
- `motion-reveal`
  - 필터, 검색, 페이지네이션으로 새로 렌더링되는 카드에 사용한다.
  - animation duration은 `360ms`다.
  - `--motion-order` CSS variable로 stagger 순서를 조정한다.

## 적용 범위

현재 적용된 범위:

- `/docs` search panel
- `/docs` browse controls
- `/docs` stats card
- `/docs` section summary card
- `/docs` document card list
- `/feed` curated card list
- `/feed` filtered empty state

아직 적용하지 않는 범위:

- article body heading scroll
- code block 내부 syntax highlight
- global route transition overlay
- drawer open/close animation

## 주의점

느린 애니메이션은 UI가 고급스러워 보일 수도 있지만, 검색/필터/페이지 이동에서는 답답하게 느껴질 수 있다.

따라서 `/docs`와 `/feed` 목록 전환은 부드럽지만 짧게 유지한다.

긴 전환이 필요한 경우에도 `prefers-reduced-motion` 대응을 먼저 확인한다.
