## Docs Responsive Policy

### Goal

`apps/docs`는 단순히 컴포넌트별로 `sm`, `md`, `lg`를 섞어 쓰지 않고, 앱 셸과 콘텐츠 레이아웃의 책임을 나눠서 반응형 기준을 관리한다.

### Breakpoint Roles

- `< 640px`
  - mobile shell
  - hamburger drawer 사용
  - bottom navigation 사용
  - 상단 global navigation 숨김
- `640px ~ 1023px`
  - compact desktop / tablet shell
  - top navigation 노출
  - mobile drawer 제거
  - bottom navigation 제거
  - 본문은 여전히 단일 컬럼 유지 가능
- `>= 1024px`
  - full desktop content layout
  - article sidebar, multi-column feed, wide editorial layout 활성화

### Rules

- app shell 전환은 `sm`을 기준으로 한다.
  - 대상: `Header`, `MobileNavDrawer`, `MobileBottomNav`, layout padding
- 콘텐츠 밀도 전환은 `lg`를 기준으로 한다.
  - 대상: `MainFeed`, `ArticleDetail`, `AboutUs`의 멀티 컬럼 배치
- `md`는 보조 미세조정 용도로만 사용한다.
  - 예: 내부 gap, padding, icon spacing
  - shell의 show/hide 기준으로는 가급적 쓰지 않는다.

### Why

이 정책을 쓰는 이유는 `640px ~ 767px` 구간에서 모바일 셸은 살아 있는데 일부 내부 컴포넌트만 `sm` 규칙을 먼저 적용받아 UI가 어색하게 깨지는 문제를 방지하기 위해서다.

대표적으로 다음 조합은 피한다.

- drawer는 `md:hidden`
- bottom nav도 `md:hidden`
- 그런데 sheet 내부 또는 일부 섹션은 `sm:*`

이 조합은 mobile/tablet 경계에서 셸과 콘텐츠의 기준이 갈라져 예측하기 어려운 상태를 만든다.

### 열린 모바일 메뉴의 화면 전환 (2026-09-22)

- `MobileNavDrawer`는 `sm:hidden`과 같은 `(min-width: 40rem)` 경계를 `matchMedia`로 구독한다. 기본 브라우저 설정에서 640px이며, 공용 Sidebar의 768px 기준과 혼동하지 않는다.
- 경계를 넘어 desktop/tablet shell로 바뀌면 `open`을 false로 전환한다. CSS로 패널만 숨기거나 overlay만 제거하지 않고, Base UI Sheet의 닫힘 절차로 overlay, focus trap, 스크롤 잠금을 해제한다.
- 메뉴는 초기 상태가 닫힘이므로 첫 렌더링에서 window를 읽거나 화면 크기에 따라 서버 HTML을 나누지 않는다. 이벤트 구독은 unmount 시 해제한다.
- 639px 이하에서는 열린 상태를 유지한다. 다시 모바일로 돌아오면 자동으로 열리지 않으며, 사용자가 trigger를 눌러 다시 열 수 있다.
- body 스타일을 강제로 초기화하거나 다른 overlay의 잠금을 해제하지 않는다. 메뉴 링크 이동, Escape, 닫기 버튼의 기존 동작은 유지한다.

[브라우저 회귀 테스트](../../apps/docs/e2e/mobile-drawer-resize.spec.ts)는 경계값과 가로/세로 viewport 전환, 실제 wheel 스크롤 복구, desktop 링크 포커스 가능 여부, 모바일 복귀 후 재열기를 확인한다. 결과는 [작업 기록](../worklog/2026-09/2026-09-22-mobile-drawer-resize.md)에 남긴다.

### Initial Application

현재 이 정책은 아래 shell 레이어에 먼저 적용되었다.

- `apps/docs/widgets/app-shell/ui/header.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx`
- `apps/docs/widgets/app-shell/ui/navigation.tsx`
- `apps/docs/app/layout.tsx`
- `apps/docs/widgets/m/ui/main-feed.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`

### Follow-up

- `widgets/*` 내부에서도 `md`가 shell 전환처럼 쓰이는 지점이 있는지 점검
- 새로운 global navigation 또는 drawer variant를 추가할 때는 먼저 이 문서를 기준으로 breakpoint 역할을 확인
- 실제 브라우저/기기 점검은 `docs/runbooks/docs-responsive-browser-device-checklist.md`를 따른다.

## Widget Audit Notes

`MainFeed`, `ArticleDetail`, `AboutUs` 점검 기준은 아래처럼 둔다.

- `sm`
  - shell 전환과 outer gutter 정렬에 한정
  - 예: `px-4 -> sm:px-6`
- `md`
  - spacing, top offset, 내부 완충 여백 같은 미세조정
  - 예: `md:px-8`, `md:pt-*`
- `lg`
  - 실제 콘텐츠 밀도 변화
  - 예: multi-column, 카드 패딩 증가, 이미지 그리드 분할, author row 수평 전환

점검 시 피할 패턴:

- `sm:grid-cols-*`
- `sm:flex-row`
- `sm:p-*`로 카드 밀도 자체를 키우는 규칙

위 패턴은 `640px ~ 1023px` 구간에서 shell은 compact desktop으로 바뀌었는데,
content까지 너무 빨리 desktop 밀도로 올라가서 읽기 리듬이 깨질 수 있다.
