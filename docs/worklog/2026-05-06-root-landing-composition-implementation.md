# 2026-05-06 Root Landing Composition Implementation

## 요약

- 루트 `/` 화면을 `HeroSection` 단일 렌더에서 `root landing composition` 구조로 전환했다.
- 새 `root-landing` 위젯과 `latest-note-row` 엔티티를 추가했다.
- `141:2 Landing Page - HEAPFORGE` 기준으로 `hero -> thematic foundations -> latest notes` 흐름을 코드에 반영했다.

## 추가 내용

- `apps/docs/widgets/root-landing/ui/root-landing-page.tsx`
- `apps/docs/widgets/root-landing/ui/landing-hero.tsx`
- `apps/docs/widgets/root-landing/ui/thematic-foundations.tsx`
- `apps/docs/widgets/root-landing/ui/latest-notes.tsx`
- `apps/docs/entities/document/ui/latest-note-row.tsx`

## 변경 내용

- `apps/docs/app/page.tsx`
  - `HeroSection` 대신 `RootLandingPage` 렌더
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/architecture/docs-next-intl-usage-policy.md`

## 메모

- 루트 페이지는 이제 전용 composition 레이어를 갖는다.
- 기존 `home-hero`는 즉시 제거하지 않고, 루트와 분리된 과거 자산으로 남겨 두었다.
- `latest notes`는 실제 문서 데이터를 기반으로 상위 4개 문서를 노출한다.
- 한국어 locale에서는 hero headline tracking을 완화하고 `break-keep`을 적용해 단어가 과도하게 붙어 보이지 않도록 조정했다.
