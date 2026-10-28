# Docs Design Token Usage Policy

## Goal

`docs` 앱은 화면별 임시 색상, radius, shadow를 개별적으로 늘리는 대신 `packages/tailwind-config/shared-styles.css`의 공용 토큰과 조합 클래스를 우선 사용한다.

이 정책의 목적은 다음과 같다.

- 시각 톤을 페이지 간 일관되게 유지한다.
- 라이트/다크 모드 전환 시 대응 범위를 줄인다.
- hover / focus-visible 상태를 같은 기준으로 맞춘다.
- 이후 접근성 점검에서 focus ring과 대비를 한 곳에서 조정할 수 있게 한다.

## Source Of Truth

디자인 원본 의도는 [design.md](../../apps/docs/.stitch/design.md)에 있고, 실제 런타임 토큰은 [shared-styles.css](../../packages/tailwind-config/shared-styles.css)에 있다.

외부 레퍼런스 기반 조정이 필요한 경우에는, 화면 레이아웃을 바로 복제하지 않고 먼저 `shared-styles.css`의 token 계층을 조정한 뒤 shell/component가 그 값을 따르게 한다.

예:

- `2026-05-06` HeapForge reference zip 정렬

실제 구현에서는 `design.md`의 의미를 직접 복사하지 않고, 아래 공용 유틸을 우선 사용한다.

- `ds-card`
- `ds-panel`
- `ds-panel-muted`
- `ds-button-primary`
- `ds-button-secondary`
- `ds-outline-button`
- `ds-chip`
- `ds-chip-muted`
- `ds-input`
- `ds-code-shell`
- `ds-code-shell__header`
- `ds-progress-line`
- `ds-focus-ring`

## Replacement Rules

### 1. 기본 surface / card

문서 카드, 통계 카드, 허브 카드, 검색 결과 카드는 먼저 `ds-card` 또는 `ds-panel-muted`로 표현한다.

- `ds-card`: hover / focus-visible 반응이 필요한 링크형 카드
- `ds-panel-muted`: 정적 요약 블록, stat, 보조 카드
- `ds-panel`: 페이지 상단 intro / hero / search summary 같은 강조 섹션

### 2. 버튼 / 링크

버튼과 CTA는 아래 규칙을 따른다.

- 강한 CTA: `ds-button-primary`
- 보조 CTA: `ds-button-secondary`
- 중립 outline CTA: `ds-outline-button`

텍스트 링크만 필요한 경우에도 hover 색은 `text-primary` 또는 `text-on-surface` 기준으로 맞춘다.

### 3. 입력 필드

입력 필드는 `ds-input`을 우선 사용한다.

`ds-input`은 아래 동작을 기본으로 가진다.

- surface-container-low 기반 배경
- primary 기반 bottom border
- `focus-visible` 시 전체 border + glow

### Primary 대비 기준

2026-10-25 로컬 구현부터 브랜드 주황 `--primary: #f97316`은 유지하고, 그 위의 작은 글자는 라이트·다크 모두 `--primary-foreground: #171717`을 사용한다. 밝은 foreground를 유지하려고 브랜드·링크 색 전체를 바꾸지 않는다. Button 기본 variant, Badge 기본 variant와 링크, 활성 필터·페이지 번호 등 같은 역할의 소비자는 이 토큰을 공유한다.

활성 텍스트는 기본·hover·focus 상태에서 최소4.5:1을 검사한다. primary Button·링크 Badge와 `.ds-button-primary`는 foreground 기반2px 외곽선·3px offset을 제공하고, 강제 색상 모드에서는 시스템 `Highlight`를 사용한다. 기존 반투명 glow만으로 포커스 가시성을 보장하지 않는다. Disabled 상태는 비활성 요소 예외이며 키보드 건너뛰기·비활성 동작을 별도로 검사한다.

검사는 최종 computed style과 투명도 합성을 사용한다. 전환 도중 색상을 최종 상태처럼 판정하지 않으며, 그라데이션·사진 배경을 단색으로 가정해 통과시키지 않는다. 최소 기준을 반올림해 판정하지 않는다. [실제 브라우저 검증](../verification/accessibility/2026-10-25-primary-action-contrast.md)의 범위·한계를 함께 확인한다. 모든 variant나 페이지 전체의 WCAG 적합성을 보장하는 정책은 아니다.

### 4. Focus Ring

포커스 처리의 기본은 `:focus-visible`이다.

- 카드 링크, 아이콘 버튼, 커스텀 입력 래퍼는 `ds-focus-ring` 사용
- 자체 컴포넌트 유틸(`ds-card`, `ds-button-*`, `ds-input`)은 내부적으로 동일 glow 기준 사용

Primary 동작에는 위의 명시적 외곽선을 추가로 사용한다. 다른 컴포넌트에 적용된 기존 glow와 별개의 대비 확인 대상이다.

즉, 앞으로 `focus:border-*`, `focus:ring-*`, 임의 shadow를 화면마다 따로 쓰지 않고 `--shadow-glow-primary` 중심으로 맞춘다.

## Exceptions

아래는 당장 제거 대상이 아니다.

- 브랜드 성격을 위한 gradient 배경
- topic tone 구분을 위한 accent color
- 디바이스 mockup 프레임처럼 실제 물성을 표현하는 장식 요소
- 이미지/아트워크에 가까운 hero decoration

단, 이런 예외도 가능하면 CSS variable 또는 토큰 클래스 위에서 표현한다.

## First Pass Scope

2026-05-05 1차 정리 범위:

- `MainFeed`
- `DocsIndex`
- `ArticleDetail`
- `AboutUs`
- `Search`

2026-05-05 2차 정리 범위:

- `/category`
- `/category/[main]`
- `/category/[main]/[sub]`
- `content-hub`
- `main-category-card`
- `category-document-card`
- `sub-category-card`

이후 확장 대상:

- `/category` 계열 허브
- 모바일 drawer / bottom nav 상호작용 계열
- shell 공통 CTA / icon button 계열
