# 2026-08-28 Docs Mobile Footer Bottom Nav Alignment

## 배경

모바일 화면에서 footer 링크와 bottom navigation이 함께 보이면 하단 정보 구조가 무겁고 중복되어 보일 수 있다.

`docs` 앱의 responsive policy는 shell 전환을 아래처럼 둔다.

- `< 640px`: mobile shell, drawer, bottom navigation
- `640px ~ 1023px`: compact desktop / tablet shell
- `>= 1024px`: full desktop layout

따라서 footer의 보조 링크는 모바일과 tablet portrait에서 굳이 노출하지 않고, desktop 폭에서만 보이도록 늦추는 편이 더 일관적이다.

## 조치

- footer 보조 링크 노출 기준을 `sm:flex`에서 `lg:flex`로 늦췄다.
- footer의 desktop row layout도 `md:flex-row`에서 `lg:flex-row`로 늦췄다.
- 모바일 bottom nav는 header의 주요 route와 맞게 `Feed / Web / Mobile / UI/UX / About` 5개 항목으로 정리했다.
- bottom nav에 safe area padding과 더 명확한 active background를 적용했다.
- bottom nav와 footer 보조 링크에 접근성 label과 e2e test id를 추가했다.
- Playwright shell navigation visibility smoke test를 추가했다.

## 기대 효과

- `< 640px`에서는 bottom nav가 primary navigation 역할을 맡고 footer는 브랜드/저작권 정보에 집중한다.
- `640px ~ 1023px`에서는 top navigation만 사용하고 footer 링크는 숨겨 하단 밀도를 줄인다.
- `>= 1024px`에서는 footer 보조 링크를 다시 보여 desktop 정보 구조를 유지한다.

## 확인 포인트

- `/docs`, `/feed`, `/about` 모바일 하단에서 footer 링크와 bottom nav가 동시에 과하게 보이지 않는지 확인한다.
- `/ui-ux` route에서 bottom nav active 상태가 표시되는지 확인한다.
- safe area가 있는 iOS 기기에서 bottom nav 아이콘이 하단에 붙어 보이지 않는지 확인한다.

## 검증 자동화

`apps/docs/e2e/shell-navigation.spec.ts`에서 아래 기준을 확인한다.

- mobile viewport에서는 bottom nav가 보이고 footer utility links는 숨겨진다.
- mobile bottom nav는 5개 주요 route를 포함한다.
- tablet viewport에서는 bottom nav와 footer utility links가 모두 숨겨진다.
