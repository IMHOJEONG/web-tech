# 2026-05-08 UIUX Hub Figma Alignment

## 요약

- `/ui-ux`는 generic `ChannelHubPage`에서 분리했다.
- Figma `141:189` 기준으로 `Category Header -> Bento Grid -> Newsletter -> More Articles -> Load More` 흐름을 갖는 전용 editorial hub로 재구성했다.

## 이유

- 기존 `/ui-ux`는 `/web`, `/mobile`과 같은 generic `HubPage`를 사용하고 있었다.
- 하지만 Figma `UI/UX Category - HEAPFORGE Branding`은 같은 정보 구조가 아니라, 시선 흐름이 강한 magazine-style page에 더 가까웠다.
- 특히 아래 차이가 컸다.
  - 대형 featured case study
  - 우측 stacked small article cards
  - 하단 tutorial card + black newsletter split row
  - more articles 3-column strip

## 변경 내용

- `apps/docs/app/ui-ux/page.tsx`
  - `ChannelHubPage` 대신 `UiUxHubPage` 렌더
- `apps/docs/widgets/content-hub/ui/uiux-hub-page.tsx`
  - 전용 UI/UX 허브 컴포지션 추가
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
  - `uiuxHub` namespace 추가

## 메모

- 실제 UI/UX 문서가 적은 동안은 fallback editorial copy를 사용한다.
- 하지만 링크 흐름은 여전히 `/docs/*` 또는 `/feed?topic=uiux`로 이어지도록 유지한다.
- `/web`, `/mobile`은 계속 generic channel hub를 사용한다.
