# Docs Design Token Usage Policy

## Goal

`docs` 앱은 화면별 임시 색상, radius, shadow를 개별적으로 늘리는 대신 `packages/tailwind-config/shared-styles.css`의 공용 토큰과 조합 클래스를 우선 사용한다.

이 정책의 목적은 다음과 같다.

- 시각 톤을 페이지 간 일관되게 유지한다.
- 라이트/다크 모드 전환 시 대응 범위를 줄인다.
- hover / focus-visible 상태를 같은 기준으로 맞춘다.
- 이후 접근성 점검에서 focus ring과 대비를 한 곳에서 조정할 수 있게 한다.

## Source Of Truth

디자인 원본 의도는 [apps/docs/.stitch/design.md](/Users/coder/Desktop/project/web-tech/apps/docs/.stitch/design.md:1)에 있고, 실제 런타임 토큰은 [packages/tailwind-config/shared-styles.css](/Users/coder/Desktop/project/web-tech/packages/tailwind-config/shared-styles.css:443)에 있다.

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

### 4. Focus Ring

포커스 처리의 기본은 `:focus-visible`이다.

- 카드 링크, 아이콘 버튼, 커스텀 입력 래퍼는 `ds-focus-ring` 사용
- 자체 컴포넌트 유틸(`ds-card`, `ds-button-*`, `ds-input`)은 내부적으로 동일 glow 기준 사용

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
