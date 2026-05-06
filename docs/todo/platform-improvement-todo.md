# Platform Improvement TODO

이 문서는 `worklog`와 다르게, 여러 세션에 걸쳐 지속적으로 관리하는 개선 백로그입니다.

운영 규칙:

- 구현 중 새로 드러난 개선점은 이 문서에 먼저 추가합니다.
- 실제로 착수한 내용과 결정 과정은 `docs/worklog/`에 기록합니다.
- 구조적 결정으로 승격되면 `docs/architecture/` 문서로 분리합니다.

상태 표기:

- `[ ]` 아직 미착수
- `[-]` 진행 중 또는 방향 검토 중
- `[x]` 완료

우선순위:

- `P0` 현재 장애/회귀/운영 리스크
- `P1` 가까운 시일 내 반영 권장
- `P2` 품질 향상용 중기 과제

## Planning / Product

- [x] `P1` `docs` 앱의 정보구조를 확정한다.
  - `Feed / Web / Mobile / UI/UX / About`를 사용자-facing IA로 정의
  - `Category`는 taxonomy 허브, 허브 페이지는 탐색 단위, 상세 페이지는 학습 단위로 문서화
  - 기준 문서: `docs/architecture/docs-app-information-architecture.md`
- [ ] `P1` 콘텐츠 운영 모델을 정한다.
  - `apps/docs/data` 기반 정적 운영을 유지할지
  - 별도 CMS/DB/API 계약으로 확장할지 결정
- [x] `P2` 검색 경험의 목표를 정의한다.
  - 검색 결과는 `/docs?q=...` 상태로 운영
  - 검색 범위는 `title / summary / taxonomy / content` 우선순위로 정리
  - empty state와 추천 검색어 정책 문서화
  - 기준 문서: `docs/architecture/docs-search-experience-policy.md`
- [x] `P1` `/feed`와 `/docs`의 실제 화면 차이를 더 분명히 만든다.
  - `/feed`는 `MainFeed` 기반 큐레이션 피드로 유지
  - `/docs`는 전용 index/search layout으로 분리
  - 기준 문서: `docs/architecture/docs-feed-and-docs-routing-policy.md`

## Code / Architecture

- [x] `P1` `apps/docs`의 FSD 3차 정리를 진행한다.
  - `shared/layout`, `shared/navigation` 기반 app shell을 `widgets/app-shell`로 이동
  - `app/layout.tsx`는 shell widget을 조합하는 얇은 엔트리로 정리
  - 후속으로 widget/feature/entity 경계 재점검은 별도 항목으로 계속 진행
- [x] `P1` `apps/docs`의 widget / feature / entity 경계를 한 번 더 재점검한다.
  - `toc`는 `widgets/article-toc`
  - `category`는 `entities/category`
  - `architecture-page`는 `widgets/architecture-page`
- [x] `P1` `apps/docs`의 남은 legacy `components/` 레이어를 계속 소진한다.
  - `app-sidebar`는 `widgets/category-sidebar`
  - `content-hub`는 `widgets/content-hub`
  - `hero`는 `widgets/home-hero`
- [x] `P1` `apps/docs/components/react-flow`의 최종 레이어를 확정한다.
  - 메인 hero UX 관점에서 장식 대비 효용이 낮다고 판단해 제거
  - `home-hero`는 더 직접적인 콘텐츠 preview UI로 대체
- [x] `P1` `next-intl` 기준으로 i18n 사용 방식을 통일한다.
  - `Brand`, app shell navigation, `Footer`, `Search`를 실제 메시지에 연결
  - 메시지 키는 `common / navigation / header / footer / search` namespace와 camelCase 규칙으로 정리
  - 기준 문서: `docs/architecture/docs-next-intl-usage-policy.md`
- [ ] `P1` `docs` app shell의 responsive 정책을 widget 레벨까지 확장 적용한다.
  - `MainFeed`, `ArticleDetail`, `AboutUs` 내부의 `sm/md/lg` 사용 재점검
  - shell breakpoint와 content breakpoint 충돌 제거
- [ ] `P2` `MainFeed`, `HubPage`, `ArticleDetail`의 데이터 주입 방식을 정리한다.
  - curated static data와 real document data를 어디까지 분리할지 결정
- [ ] `P2` UI package build/export 전략과 소비 앱 설정을 지속 점검한다.
  - `transpilePackages`
  - build artifact usage
  - import path 안정성

## UI / UX

- [-] `P0` `640px ~ 1023px` 구간의 shell/UI 동작을 실제 디바이스 기준으로 점검한다.
  - header
  - mobile drawer
  - bottom nav
  - article/feed spacing
- [-] `P1` 루트 `/` 화면을 `141:2 Landing Page - HEAPFORGE` 기준으로 재구성한다.
  - 현재 `HeroSection` 단일 구성을 landing page 섹션 구조로 확장
  - `Hero Section`, `Thematic Foundations`, `Latest Notes`를 별도 위젯/엔티티로 분리 검토
  - 기준 문서: `docs/architecture/docs-heapforge-alignment-checklist.md`
- [x] `P1` `MainFeed` 필터 버튼에 실제 인터랙션을 연결한다.
  - `query string` 기반으로 확정
  - `/feed?topic=web|mobile|uiux` 형태로 상태를 표현
  - 기준 문서: `docs/architecture/docs-feed-filter-policy.md`
- [ ] `P1` `About` contact form의 사용자 흐름을 확정한다.
  - 실제 전송
  - 제출 상태
  - 유효성 검사
- [ ] `P1` footer 링크를 실제 라우트 또는 외부 링크와 연결한다.
  - `PRIVACY`
  - `TERMS`
  - `CHANGELOG`
  - `GITHUB`
- [ ] `P2` empty state, loading state, error state의 시각 톤을 통일한다.
- [ ] `P2` keyboard navigation / focus ring / drawer close flow 접근성을 점검한다.

## Design / Design System

- [ ] `P1` Figma asset 의존 화면을 모두 `public/figma/*` 또는 정식 에셋으로 이관한다.
  - `article-detail` 외 나머지 페이지도 점검
- [-] `P1` `HEAPFORGE` 기준 화면과 현재 `docs` 구현의 정렬 체크리스트를 운영한다.
  - 공통 shell, `/feed`, `/about`, `article-detail`, `/category` 순으로 정렬
  - 기준 프레임: `141:676`, `141:325`, `141:470`, `141:189`, `141:2`
  - 기준 문서: `docs/architecture/docs-heapforge-alignment-checklist.md`
- [-] `P1` 디자인 토큰 사용 일관성을 높인다.
  - 하드코딩 색상, radius, shadow 제거
  - `design.md` 토큰 기준으로 치환
  - 1차 적용: `MainFeed`, `DocsIndex`, `ArticleDetail`, `AboutUs`, `Search`
  - 2차 적용: `/category` 계열, `content-hub`, category cards
- [ ] `P2` mobile/top/bottom chrome 아이콘을 Figma 자산 또는 확정 아이콘 세트로 통일한다.
- [ ] `P2` 라이트 모드/다크 모드 시안 차이를 페이지별로 점검한다.
  - `About`
  - `Feed`
  - `ArticleDetail`
- [ ] `P2` typography scale과 실제 component usage를 대조한다.
  - headline/body/label usage mismatch 정리

## Infra / Tooling

- [ ] `P0` `pnpm` catalog 도입 이후 네트워크 가능한 환경에서 `pnpm install --lockfile-only` 재검증
- [ ] `P1` root `package.json`까지 catalog/버전 관리 전략을 확장할지 결정
- [ ] `P1` catalog reference 정합성 검사를 스크립트나 CI 체크로 자동화
- [ ] `P1` `docs`와 `web`의 공통 build/lint/typecheck 파이프라인을 Turbo 기준으로 정리
- [ ] `P2` design asset 동기화 절차를 runbook으로 정리
  - Figma local asset export
  - `public/figma/*` 저장 규칙
- [ ] `P2` 환경별 dev/build 체크리스트를 보강한다.
  - 폰트
  - asset
  - package build
  - i18n

## Content / Editorial

- [ ] `P1` landing / hero 계열 카피의 자연스러운 한국어 표현을 다듬는다.
  - 직역투 표현보다 한국어 사용자에게 자연스럽게 읽히는 문장으로 조정
  - headline, eyebrow, CTA, section title 우선 점검
  - 특히 `/` root landing과 `/about` hero의 한국어 카피를 우선 정리
- [ ] `P1` `Mobile` 섹션의 실제 콘텐츠 초안을 작성한다.
- [ ] `P1` `UI/UX` 섹션도 상세형 static spotlight가 아니라 실제 문서 연결 구조로 확장할지 결정
- [ ] `P2` article metadata 정책을 정리한다.
  - author
  - read time
  - category label
  - thumbnail fallback

## Review Queue

- [ ] `P1` `docs-responsive-policy.md` 적용 이후 shell 회귀 테스트
- [ ] `P1` FSD 문서와 실제 폴더 구조의 불일치 재점검
- [ ] `P2` `apps/docs/shared/message/*.json` 키 사용 현황과 dead key 정리
