# Docs Next Intl Usage Policy

## Purpose

이 문서는 `apps/docs`에서 `next-intl` 메시지를 어떤 기준으로 구성하고 사용할지 정리합니다.

이 문서는 다음 질문에 답하도록 작성합니다.

- 어떤 UI 문자열을 메시지 파일로 관리해야 하는가
- 메시지 namespace는 어떤 기준으로 나누는가
- 메시지 키 이름은 어떤 규칙으로 짓는가
- server component와 client component에서 번역은 어떻게 가져오는가

## Core Decision

`apps/docs`의 공용 UI 문자열은 하드코딩하지 않고 `next-intl` 메시지로 관리합니다.

현재 기준 컴포넌트:

- `Brand`
- app shell navigation
- `Header`의 drawer 관련 라벨
- `Footer`
- `Search`
- `DocsIndex`
- `RootLanding`
- `AboutUs`
- `ArticleDetail`
- locale-aware `metadata` / `openGraph` copy

이 기준은 이후 다른 widget과 feature에도 동일하게 확장합니다.

## Namespace Rules

메시지는 화면 역할 또는 UI 책임 기준으로 top-level namespace를 나눕니다.

현재 기준 namespace:

- `common`
- `metadata`
- `navigation`
- `header`
- `footer`
- `home`
- `rootLanding`
- `search`

규칙은 다음과 같습니다.

1. 여러 화면에서 재사용되는 짧은 공용 문자열은 `common`
2. 전역 탐색 라벨은 `navigation`
3. app shell의 헤더/드로어 문구는 `header`
4. footer 고정 문구는 `footer`
5. 특정 기능에 종속된 문자열은 feature 이름 namespace 사용

예:

- `common.brand`
- `metadata.site.title`
- `navigation.feed`
- `header.drawer.openAriaLabel`
- `footer.links.github`
- `search.input.placeholder`
- `rootLanding.hero.titleLineOne`

## Key Naming Rules

메시지 키는 camelCase로 통일합니다.

권장:

- `resultTitle`
- `resultDescription`
- `submitAriaLabel`
- `openAriaLabel`

지양:

- `result-title`
- `result_description`
- `submit-aria-label`

즉 규칙은:

- top-level namespace는 소문자 단어
- 하위 키는 camelCase
- 구조가 필요한 경우만 중첩

## Usage Rules

### Server Components

server component에서는 `next-intl/server`의 `getTranslations`를 사용합니다.

예:

- `Footer`
- `metadata`
- `AboutUs`
- `ArticleDetail`

이 경우 요청 시점에 번역을 가져오고, 하드코딩 문자열을 직접 두지 않습니다.

### Request Locale

locale는 request 기준으로 결정합니다.

현재 우선순위:

1. `NEXT_LOCALE` cookie
2. `Accept-Language` header
3. fallback `en`

즉 locale-aware metadata나 server-rendered copy도 같은 request locale 해석을 공유합니다.

### Client Components

client component에서는 `useTranslations`를 사용합니다.

예:

- `Brand`
- `Navigation`
- `MobileNavDrawer`
- `MobileBottomNav`
- `Search`

이 경우 UI 상호작용과 함께 문자열도 같은 namespace에서 읽습니다.

## What To Localize First

우선 로컬라이즈해야 하는 문자열은 다음 순서로 봅니다.

1. navigation label
2. button / link label
3. aria label / screen reader text
4. empty state / helper text
5. marketing copy or long-form editorial text

즉 겉으로 보이는 문구뿐 아니라 접근성 텍스트도 같은 정책으로 관리합니다.

## What To Avoid

다음 패턴은 피합니다.

- 같은 의미의 문자열을 여러 namespace에 중복 정의
- 하드코딩 문자열과 메시지 키를 혼용
- kebab-case와 camelCase를 섞어 사용
- 단순 공용 문자열인데 특정 페이지 namespace 안에 묻어두는 구조

## Current Structure

현재 `apps/docs/shared/message/*.json`은 아래 구조를 기준으로 사용합니다.

- `common.brand`
- `metadata.site.*`
- `navigation.feed|web|mobile|uiux|about`
- `header.drawer.*`
- `footer.tagline`
- `footer.links.*`
- `search.input.*`
- `search.empty.*`
- `rootLanding.*`
- `docsIndex.*`
- `about.*`
- `articleDetail.*`

## Follow-Up

- 새 화면을 추가할 때는 page/widget 단위 namespace를 먼저 정하고 시작
- metadata, OG copy를 locale-aware 하게 만들지 추후 검토
- dead key 정리 시 이 문서의 namespace 규칙을 기준으로 검사
