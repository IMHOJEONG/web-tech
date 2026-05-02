# Docs App FSD Guide

## Purpose

이 문서는 `apps/docs` 앱을 Feature-Sliced Design 관점에서 어떻게 해석하고, 어떤 기준으로 구조를 정리할지 독립적으로 설명하는 전용 문서입니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- 현재 `docs` 앱 구조는 어디까지 FSD에 맞는가
- 어떤 폴더가 어떤 책임을 가져야 하는가
- 지금 당장 어떤 파일부터 이동하는 것이 안전한가
- 이후 리팩터링은 어떤 순서로 진행해야 하는가

## Current Assessment

현재 구조는 일부 FSD 개념을 이미 사용하고 있지만, 레이어 경계가 아직 명확하지 않습니다.

좋은 점:

- `feature/` 폴더가 이미 존재하고 일부 사용자 기능을 분리하고 있습니다.
- `widgets/` 아래에 페이지 본문과 app shell이 점차 역할별로 분리되고 있습니다.
- 페이지 단위 대형 UI가 점차 공용 템플릿으로 재사용되기 시작했습니다.

아쉬운 점:

- `components/` 폴더에 페이지급 UI, 단순 프리미티브, 실험성 코드가 함께 섞여 있습니다.
- `shared/`, `components/`, `feature/` 간 책임 기준이 문서화되어 있지 않았습니다.
- `MainFeed`, `AboutUs`, `ArticleDetail` 같은 대형 화면 컴포넌트는 단순 component보다 `widget` 성격이 더 강합니다.

결론:

- 현재 상태는 `FSD 완성형`이 아니라 `FSD로 이행 중인 구조`입니다.

## Target Layers

`apps/docs`에서 우선적으로 사용할 FSD 레이어 기준은 다음과 같습니다.

### `shared`

앱 전역에서 재사용되는 기술적 기반과 범용 UI입니다.

예:

- theme
- 공용 토큰/유틸
- i18n 메시지
- brand 같은 범용 프리미티브

### `entities`

도메인 데이터나 도메인 표현 단위를 담습니다.

현재 `docs` 앱에서는 아직 약한 레이어입니다.

향후 후보:

- `document`
- `category`
- `author`

예:

- 문서 카드 메타 표시
- author badge
- category chip

현재 1차 적용:

- `MainCard`를 `entities/document`로 이동

### `features`

사용자 액션이나 상호작용 단위를 담습니다.

현재 이미 존재:

- `search`
- `theme-toggle`
- `category`

이 레이어는 유지하고, 화면 전체를 담지 않도록 제한하는 것이 좋습니다.

현재 1차 적용:

- `Search` UI를 `feature/search/ui`로 이동
- `ThemeToggle` UI를 `feature/theme-toggle/ui`로 이동

### `widgets`

페이지 안에서 큰 의미 단위를 가지는 조합형 UI입니다.

현재 1차 분리 대상:

- `main-feed`
- `about-us`
- `article-detail`
- `app-shell`

이 레이어는 여러 shared/feature/entity를 조합해 실제 페이지 본문을 구성합니다.

현재 3차 적용:

- `Header`, `Footer`, `MobileBottomNav`, `MobileNavDrawer`, `Navigation`을 `widgets/app-shell`로 이동

이유:

- app shell은 앱 전역에서 보이지만, 단순 기술 기반이 아니라 실제 사용자 화면을 구성하는 조합형 UI입니다.
- `shared`에 두면 범용 프리미티브와 화면 구조 레이어가 섞이기 쉽습니다.
- `widget`으로 올리면 shell도 “한 화면 단위의 큰 UI 조합”이라는 기준으로 일관되게 해석할 수 있습니다.

관련 상세 설명:

- [docs-app-shell-rationale.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-app-shell-rationale.md)

### `pages`

라우트 엔트리에서 widget을 조합하는 얇은 레이어입니다.

현재 `app/*/page.tsx`는 이 역할에 가깝고, 가능한 한 얇게 유지하는 것이 좋습니다.

## Initial Mapping

이번 1차 정리에서는 다음 기준을 적용합니다.

- `components/main-feed.tsx` → `widgets/main-feed/ui/main-feed.tsx`
- `components/about-us.tsx` → `widgets/about-us/ui/about-us.tsx`
- `components/article-detail.tsx` → `widgets/article-detail/ui/article-detail.tsx`

이유:

- 셋 다 페이지의 핵심 레이아웃을 담당하는 대형 조합 UI입니다.
- 다른 feature나 shared 컴포넌트를 품을 수 있는 상위 레이어입니다.
- 단순 범용 component로 보기 어렵습니다.

## Recommended Folder Rules

앞으로는 다음 기준을 우선 적용합니다.

1. 페이지 본문 전체를 책임지는 UI는 `widgets`로 올립니다.
2. 사용자 액션 중심의 작은 인터랙션은 `features`에 둡니다.
3. 도메인 표현 단위는 `entities`로 분리합니다.
4. 앱 전역 공용 요소는 `shared`에 둡니다.
   - 단, `Header`, `Footer`, `Navigation`처럼 화면 shell을 직접 구성하는 조합 UI는 `widgets/app-shell`로 둡니다.
5. 의미가 불분명한 신규 코드는 `components`에 추가하지 않습니다.
6. `apps/docs`에서는 barrel file(`index.ts`)을 기본 패턴으로 사용하지 않습니다.
   - 이유: TypeScript 해석/순환 참조/auto-import 혼선을 줄이기 위해서입니다.
   - import는 가능한 한 실제 파일 경로를 직접 가리킵니다.
   - 현재 `apps/docs` 내부 barrel file은 제거된 상태를 기본값으로 유지합니다.

## Migration Strategy

안전한 순서는 다음과 같습니다.

1. 대형 페이지 조합 UI를 먼저 `widgets`로 이동
2. `MainCard`처럼 문서 표현 성격이 강한 UI를 `entities/document`로 이동
3. `Search`, `ThemeToggle`처럼 기능성이 강한 UI를 `features`로 이동
4. app shell을 `widgets/app-shell`로 올려 shared와 화면 조합 UI의 경계를 분리
5. `components/`에 남은 파일을 레이어별로 소진

## Completed Third Pass

이번 3차 정리에서 완료한 항목은 아래와 같습니다.

- `apps/docs/widgets/app-shell/ui/header.tsx`
- `apps/docs/widgets/app-shell/ui/footer.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`
- `apps/docs/widgets/app-shell/ui/navigation.tsx`

이 변경으로:

- `shared/layout`은 더 이상 app shell 책임을 갖지 않습니다.
- `shared`는 메시지, brand, i18n, util, 범용 스타일 자산 중심으로 유지됩니다.
- `app/layout.tsx`는 `widgets/app-shell`을 조합하는 얇은 엔트리 역할로 정리됩니다.

## Immediate Next Candidates

다음 리팩터링 후보는 아래와 같습니다.

- `apps/docs/shared/toc.tsx`
  - article-detail 전용 widget 보조 UI인지, shared primitive인지 재판단
- `apps/docs/feature/category/*`
  - 실제로 entity/category와 feature/category 경계가 맞는지 점검
- `apps/docs/shared/architecture-page.tsx`
  - 실사용 범위와 레이어 책임 재판단

## Non-Goals

이번 단계에서 아직 하지 않는 것:

- 모든 파일을 한 번에 FSD 완성형으로 이동
- 기존 라우팅/도메인 구조 전면 재설계
- `entities` 레이어의 과도한 추상화

## Rule for Future Work

앞으로 `docs` 앱 구조 변경 시에는 이 문서를 우선 기준으로 봅니다.

- 구조적 변화가 생기면 이 문서를 먼저 갱신합니다.
- 개별 작업 로그는 `docs/worklog/`에 남깁니다.
- 장기 결정이 확정되면 별도 ADR을 추가합니다.
