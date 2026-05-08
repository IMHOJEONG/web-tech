# HEAPFORGE Alignment Checklist

이 문서는 현재 `apps/docs`를 로컬 Figma MCP에서 확인한 `HEAPFORGE` 기준 화면과 맞춰가기 위한 구현 체크리스트입니다.

목적:

- 어떤 Figma 화면을 현재 코드의 어느 라우트/위젯과 대응시킬지 명확히 정리합니다.
- 공통 shell, page layout, editorial section을 어떤 순서로 반영할지 관리합니다.
- `docs/todo/platform-improvement-todo.md`의 실행 기준 문서로 사용합니다.

## Source Frames

- `141:676` `Main Feed - HEAPFORGE Branding`
- `141:325` `About Us - HEAPFORGE Branding`
- `141:470` `Article Detail - HEAPFORGE Branding`
- `141:189` `UI/UX Category - HEAPFORGE Branding`
- `141:2` `Landing Page - HEAPFORGE`

## Priority

1. `TopNav / Footer` 공통 shell
2. `/` root landing
3. `/feed`
4. `/about`
5. `article-detail`
6. `/category`, `content-hub`

## Mapping

### 1. Shell

- Figma
  - `141:855` `TopNavBar Shell`
  - `141:830` `Footer Shell`
  - `141:447` `TopNavBar`
  - `141:438` `Footer`
  - `141:652` `Top Navigation`
  - `141:629` `Footer`
- Code
  - `apps/docs/widgets/app-shell/ui/header.tsx`
  - `apps/docs/widgets/app-shell/ui/navigation.tsx`
  - `apps/docs/widgets/app-shell/ui/footer.tsx`
  - `apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx`
  - `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`

체크리스트:

- [ ] desktop top nav spacing, active state, trailing actions를 `HEAPFORGE` shell 기준으로 정리
- [ ] footer 정보 밀도를 줄이고 브랜드 문장 + 보조 링크 구조로 단순화
- [ ] mobile bottom nav와 drawer가 shell 토큰과 icon grammar를 같이 쓰도록 정리
- [ ] search, theme, menu action의 우측 그룹 규칙을 header 전반에 통일

### 2. Feed

### 2. Root Landing

- Figma
  - `141:2` `Landing Page - HEAPFORGE`
  - 내부 기준 섹션:
    - `Navigation`
    - `Hero Section`
    - `Section - Thematic Foundations`
    - `Section - Latest Notes`
    - `Footer`
- Code
  - `apps/docs/app/page.tsx`
  - `apps/docs/widgets/home-hero/ui/hero-section.tsx`
  - `apps/docs/widgets/home-hero/ui/landing-box.tsx`

체크리스트:

- [ ] 루트 `/` 화면의 기준을 `141:2`로 고정하고, 현재 단일 hero 구성을 landing page 섹션 구조로 확장
- [ ] `Hero Section`을 `status eyebrow + large multi-line headline + long-form intro` 구조로 재구성
- [ ] `Section - Thematic Foundations`를 4-up editorial foundation section으로 신규 구현
- [ ] `Section - Latest Notes`를 최근 글 큐레이션 섹션으로 신규 구현
- [ ] 현재 `home-hero`를 유지할지, `widgets/root-landing`으로 재구성할지 최종 결정

새 컴포넌트 후보:

- [ ] `apps/docs/widgets/root-landing/ui/root-landing-page.tsx`
- [ ] `apps/docs/widgets/root-landing/ui/landing-hero.tsx`
- [ ] `apps/docs/widgets/root-landing/ui/thematic-foundations.tsx`
- [ ] `apps/docs/widgets/root-landing/ui/latest-notes.tsx`
- [ ] `apps/docs/entities/document/ui/latest-note-row.tsx`

구현 메모:

- 현재 `app/page.tsx`는 `HeroSection` 하나만 렌더하고 있다.
- 따라서 `141:2`를 반영하려면 root 전용 page composition이 필요할 가능성이 높다.
- 공통 shell은 재사용하고, landing 내부 editorial section만 별도 위젯으로 분리하는 방향이 적합하다.

`HeroSection -> root landing composition` 설명:

- 현재 `HeroSection`은 `home-hero` 위젯 하나가 루트 화면 전체 역할을 대신하는 구조다.
- 하지만 `141:2 Landing Page - HEAPFORGE`는 단일 hero가 아니라:
  - hero
  - thematic foundations
  - latest notes
  - footer 직전 editorial flow
    로 이어지는 다중 섹션 landing page다.
- 그래서 루트 `/`는 더 이상 `hero 하나를 보여주는 페이지`가 아니라, 여러 섹션을 조합하는 `page composition`이 되어야 한다.
- 이때 역할 분리는 아래처럼 가져가는 것이 적합하다:
  - `root-landing-page`
    - 루트 화면 전체 섹션 순서를 조합
  - `landing-hero`
    - 최상단 메시지, status eyebrow, lead copy 담당
  - `thematic-foundations`
    - 4개 핵심 주제 카드/에디토리얼 블록 담당
  - `latest-notes`
    - 최근 글 큐레이션 리스트 담당
- 즉 변경의 핵심은 `HeroSection을 키우는 것`이 아니라, `루트 페이지를 composition 단위로 승격`하는 것이다.
- `home-hero`는 루트 전용 hero 하위 조각으로 흡수하거나, 새 `root-landing` 위젯으로 대체하는 쪽이 구조상 더 자연스럽다.

### 3. Feed

- Figma
  - `141:676` `Main Feed - HEAPFORGE Branding`
  - 내부 기준 섹션:
    - `Hero Trending Section`
    - `Category Grid Section`
    - `Newsletter Section`
- Code
  - `apps/docs/app/feed/page.tsx`
  - `apps/docs/widgets/m/ui/main-feed.tsx`

체크리스트:

- [ ] hero를 `featured editorial + author/date meta + primary CTA` 구조로 강화
- [ ] topic filter bar의 배치와 버튼 밀도를 Figma section header 구조에 맞춤
- [ ] card grid를 더 강한 `featured + secondary + grid item` 위계로 재편
- [ ] newsletter block을 독립 섹션으로 승격하고 현재 CTA 흐름과 연결

### 4. About

- Figma
  - `141:325` `About Us - HEAPFORGE Branding`
  - 내부 기준 섹션:
    - `Hero Section`
    - `Section - Pillars Bento Grid`
    - `Creator Section`
- Code
  - `apps/docs/app/about/page.tsx`
  - `apps/docs/widgets/about-us/ui/about-us.tsx`

체크리스트:

- [ ] hero 카피 블록과 우측 status/meta 블록의 2-column 위계를 Figma 기준으로 정리
- [ ] pillar section을 단순 카드 나열이 아니라 `large + small + wide` 조합으로 재구성
- [ ] creator card의 정보 밀도와 행동 링크 구성을 Figma 기준으로 더 정교하게 다듬기

### 5. Article Detail

- Figma
  - `141:470` `Article Detail - HEAPFORGE Branding`
  - 내부 기준 섹션:
    - `Article Column`
    - `Aside - SIDEBAR`
    - `Reading Progress Indicator`
- Code
  - `apps/docs/widgets/article-detail/ui/article-detail.tsx`
  - `apps/docs/widgets/article-toc/ui/article-toc.tsx`
  - `apps/docs/app/[main]/[sub]/[slug]/page.tsx`

체크리스트:

- [ ] article header의 category/date/author meta 위계를 Figma 기준으로 정리
- [ ] right sidebar를 `TOC + newsletter + related signals` 구조로 재배치
- [ ] reading progress indicator를 실제 shell 상단과 자연스럽게 통합
- [ ] code block, image pair, mobile showcase 같은 본문 컴포넌트 위계를 명확히 정리

### 6. Category / Hub

- Figma
  - `141:189` `UI/UX Category - HEAPFORGE Branding`
  - `141:2` `Landing Page - HEAPFORGE`
  - 내부 기준 섹션:
    - `Category Header`
    - `Bento Grid Layout`
    - `Newsletter`
    - `More Articles Grid`
    - `Section - Thematic Foundations`
    - `Section - Latest Notes`
- Code
  - `apps/docs/app/category/page.tsx`
  - `apps/docs/app/category/[main]/page.tsx`
  - `apps/docs/app/category/[main]/[sub]/page.tsx`
  - `apps/docs/widgets/content-hub/ui/hub-page.tsx`
  - `apps/docs/widgets/docs-index/ui/docs-index.tsx`

체크리스트:

- [ ] `/category` hero를 `directory header` 톤으로 정리
- [ ] category cards를 bento grid 기반의 편집형 허브로 재구성
- [ ] content-hub와 docs-index를 `latest notes / more articles` 흐름과 연결
- [ ] newsletter / related article block을 허브 하단 공통 섹션으로 승격

## Implementation Order

1. shell refinement
2. `/` root landing
3. `/feed`
4. `/about`
5. `article-detail`
6. `/category`, `content-hub`, `/docs`

## Notes

- 루트 `/` 화면은 이제 `141:2`를 기준 시안으로 고정한다.
- 현재 로컬 MCP로는 구조 확인이 가능하며, 실제 Figma 파일 write 권한은 아직 없는 상태입니다.
- 따라서 이 문서는 `디자인 기준 문서`이자 `코드 구현 체크리스트`로 유지합니다.
- 실제 구현 시 각 단계의 세부 결정은 `docs/worklog/`에 기록합니다.
