# Docs Motion Interaction Policy

이 문서는 `apps/docs`에서 layout transition과 list reveal animation을 어떻게 사용할지 정리한다.

- 최종 검토: 2026-10-23
- 최신 보완: main `16c51e9` 위의 로컬 작업 트리. 운영 배포와 구분한다.

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
- `motion-collection`
  - Feed·Web/Mobile 허브·문서 색인의 결과 목록에 사용한다.
  - `280ms`, 이동 `6px`, 시작 opacity `0.65`, 순서 간격 `35ms`이며 지연은 `175ms`로 제한한다.
  - 기존 `motion-reveal`의 기본값은 다른 영역에서 유지한다.
- `motion-interactive-card` / `motion-interactive-row` / `motion-filter`
  - 기존 색·테두리·그림자 토큰을 사용하고 피드백 전환은 `240ms`다.
  - fine pointer + hover 가능 + no-preference에서만 카드가 `2px` 올라간다. 터치와 키보드 focus는 위치를 이동하지 않는다.
  - row는 배경·텍스트 피드백만 사용한다. 메인 구분선의 길이 표현은 width 대신 transform으로 전환한다.

## 결과 전환과 접근성

필터·검색·정렬·페이지 상태를 결과 컨테이너의 안정적인 key에 포함한다. 같은 글이 다른 결과에도 남아 있을 때
등장이 생략되던 문제를 이 범위에서만 보완한다. 입력·필터·페이지 전체를 remount하거나 임의 시간 동안 이동을 보류하지 않는다.
URL query·뒤로/앞으로 이동과 Server Component 구조는 유지한다. 필터의 URL 이동은 실제 Next Link를 사용한다.

등장은 바깥 wrapper, hover는 안쪽 링크가 담당한다. 같은 요소에서 animation의 최종 transform이 hover transform을
덮지 않게 분리한다. focus가 들어온 wrapper는 등장 효과를 즉시 종료해 키보드로 선택한 카드를 가리지 않는다.
reduce 설정에서는 등장과 전환을 없애되 선택 색·focus ring·텍스트 피드백은 남긴다. 실행 중 설정 변경에도 적용된다.

메인의 코드 접기 영상 소개는 사용자 검토 후 제거했다. 기능 설명을 장식 영상으로 대체하지 않고 실제 탐색의 상태 변화에 모션을 사용한다.
제작·비교 도구와 녹화본은 보존하되 루트·피드에서는 요청하지 않는다. 이 결정은 글 내용에 필요한 수동 재생 영상까지 금지하지 않는다.

## 적용 범위

현재 적용된 범위:

- `/docs` search panel
- `/docs` browse controls
- `/docs` stats card
- `/docs` section summary card
- `/docs` document card list
- `/feed` curated card list
- `/feed` filtered empty state
- `/web`, `/mobile`의 실제 결과 목록과 주제 필터
- 루트의 주제 카드·최근 글 row의 hover/focus 피드백

아직 적용하지 않는 범위:

- article body heading scroll
- code block 내부 syntax highlight
- global route transition overlay
- drawer open/close animation

## 주의점

느린 애니메이션은 UI가 고급스러워 보일 수도 있지만, 검색/필터/페이지 이동에서는 답답하게 느껴질 수 있다.

따라서 `/docs`와 `/feed` 목록 전환은 부드럽지만 짧게 유지한다.

긴 전환이 필요한 경우에도 `prefers-reduced-motion` 대응을 먼저 확인한다.

## 검증

브라우저에서 motion 적용 여부를 확인할 때는 `docs/runbooks/docs-responsive-browser-device-checklist.md`의 `Motion 확인 방법`을 따른다.

특히 Chrome DevTools의 `Rendering` 패널에서 `Emulate CSS media feature prefers-reduced-motion`을 `no-preference`와 `reduce`로 번갈아 확인한다.

최신 로컬 회귀와 한계는 [실행 보고서](../verification/performance/2026-10-23-content-interaction-motion.md)에 연결한다.
