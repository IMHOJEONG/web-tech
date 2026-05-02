# Docs App Shell Rationale

## Purpose

이 문서는 `apps/docs`에서 왜 `Header`, `Footer`, `Navigation`, `MobileNavDrawer`, `MobileBottomNav`를 `shared`가 아니라 `widgets/app-shell`로 분리했는지 설명합니다.

이 문서는 다음 질문에 답하기 위해 작성합니다.

- 왜 `shared`에 두지 않았는가
- 왜 `widget`으로 해석했는가
- 왜 이름을 `app-shell`로 정했는가

## Why Not `shared`

`shared`는 보통 다음 성격의 것들을 둡니다.

- 범용 유틸
- 디자인 토큰
- i18n 메시지
- 작은 공용 UI 프리미티브
- 화면 맥락 없이 여러 곳에서 의미가 유지되는 요소

반면 `Header`, `Footer`, `Navigation`, `MobileNavDrawer`, `MobileBottomNav`는 다음 특징을 가집니다.

- 앱 화면의 골격을 직접 만든다
- 여러 `shared`, `feature`, `entity`를 조합한다
- 사용자에게 보이는 전역 shell 구조를 결정한다
- 범용 부품이라기보다 “현재 앱이 어떻게 보이는가”를 책임진다

즉 이들은 전역에서 재사용되긴 하지만, `shared`가 의미하는 “맥락 없는 범용 기반”과는 다릅니다.

정리하면:

- `shared`는 범용 기반
- `app shell`은 화면 조합 단위

이 차이 때문에 `shared`보다 `widgets`로 해석하는 것이 더 자연스럽습니다.

## Why `widget`

`widget`은 페이지 안에서 하나의 큰 의미 단위를 가지는 조합형 UI입니다.

`docs` 앱의 app shell은 다음 조건에 맞습니다.

- 헤더, 전역 네비게이션, drawer, bottom nav, footer가 함께 한 화면의 외곽 구조를 만든다
- page 엔트리에서 직접 다루기에는 너무 크고, `shared`에 두기에는 너무 화면 지향적이다
- 내부적으로 `Brand`, `Search`, `ThemeToggle`, 라우팅 상태 등을 조합한다

따라서 app shell은 작은 primitive도 아니고, 특정 도메인 entity도 아니며, 사용자 액션 하나만 담은 feature도 아닙니다.

이런 경우 `widget`이 가장 설명력이 좋습니다.

## Why The Name `app-shell`

이름을 `app-shell`로 정한 이유는 이 레이어가 “앱의 껍질”을 담당하기 때문입니다.

여기서 shell은 다음 의미를 가집니다.

- 페이지 본문 바깥에 공통으로 놓이는 구조
- 앱 전역 이동과 프레임을 제공하는 외곽 레이어
- 콘텐츠 자체보다, 콘텐츠가 담기는 컨테이너와 글로벌 chrome을 정의하는 부분

즉 `app-shell`은 다음 요소를 묶는 이름입니다.

- `Header`
- `Navigation`
- `MobileNavDrawer`
- `MobileBottomNav`
- `Footer`

이 이름의 장점:

- 단순 `layout`보다 책임이 더 분명하다
- `shared/layout`처럼 범용 레이아웃과 섞이지 않는다
- “페이지 본문 widget”과 “앱 외곽 shell widget”을 구분하기 쉽다

## Why Not Other Names

### `shared/layout`

문제:

- 너무 범용적이다
- 실제 화면 조합 UI와 범용 layout helper가 섞이기 쉽다
- FSD에서 `shared` 의미가 흐려진다

### `widgets/layout`

문제:

- `layout`은 내부 spacing/layout helper와 이름 충돌이 쉽다
- app 전역 shell이라는 의미가 약하다

### `widgets/navigation`

문제:

- footer, bottom nav, drawer까지 모두 설명하지 못한다
- navigation만의 문제처럼 축소된다

그래서 가장 포괄적이면서도 책임이 명확한 이름이 `app-shell`이었습니다.

## Practical Rule

앞으로 `apps/docs`에서 아래 질문으로 판단합니다.

1. 이 컴포넌트가 화면 외곽 구조를 직접 만드는가
2. 여러 shared/feature/entity를 조합하는가
3. 앱 전체의 글로벌 chrome 역할을 하는가

위 답이 대체로 `yes`면 `shared`보다 `widgets/app-shell`에 두는 쪽을 우선 검토합니다.

## Current Scope

현재 `app-shell`에 포함된 파일:

- `apps/docs/widgets/app-shell/ui/header.tsx`
- `apps/docs/widgets/app-shell/ui/navigation.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx`
- `apps/docs/widgets/app-shell/ui/footer.tsx`

## Follow-up

- shell 내부에서 더 작은 단위로 쪼갤 필요가 있는지 검토
- `Search`, `ThemeToggle`처럼 feature와 shell의 경계가 건강한지 계속 점검
- responsive policy가 shell 레이어와 일관되게 적용되는지 확인
