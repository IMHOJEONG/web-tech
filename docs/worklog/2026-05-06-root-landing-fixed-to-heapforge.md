# 2026-05-06 Root Landing Fixed To HEAPFORGE

## Summary

- 루트 `/` 화면의 기준 시안을 `141:2 Landing Page - HEAPFORGE`로 고정하기로 결정했다.
- 기존 체크리스트에서 landing을 선택 반영 항목으로 두지 않고, shell 다음 우선순위로 승격했다.
- 현재 `app/page.tsx`가 `HeroSection` 하나만 렌더하는 구조라서, 신규 root landing 위젯 조합이 필요하다고 판단했다.

## Current State

- `apps/docs/app/page.tsx`
  - `HeroSection`만 렌더 중
- `apps/docs/widgets/home-hero/ui/hero-section.tsx`
  - 단일 hero + preview cards 중심
- `141:2 Landing Page - HEAPFORGE`
  - `Hero Section`
  - `Section - Thematic Foundations`
  - `Section - Latest Notes`
  - `Navigation`
  - `Footer`

## Decision

- 루트 `/` 화면은 `141:2`를 고정 기준 화면으로 삼는다.
- 구현 순서는 `shell -> root landing -> feed -> about -> article-detail -> category`로 조정한다.
- root landing은 공통 shell 재사용 + landing 전용 editorial section 신규 추가 방향으로 진행한다.

## Why Composition

- 현재 루트는 `HeroSection` 단일 렌더 구조다.
- 하지만 `141:2`는 hero 하나로 끝나는 화면이 아니라, `Hero Section -> Thematic Foundations -> Latest Notes`로 이어지는 multi-section landing이다.
- 그래서 다음 구현은 `HeroSection` 내부를 계속 비대하게 키우는 방식보다, 루트 페이지를 composition으로 올리는 방향이 더 적합하다.
- 의도한 구조:
  - `root-landing-page`
    - 루트 화면 orchestration
  - `landing-hero`
    - 상단 메시지와 lead copy
  - `thematic-foundations`
    - 4-up editorial foundation section
  - `latest-notes`
    - recent notes list section

## Candidate Components

- `widgets/root-landing/ui/root-landing-page.tsx`
- `widgets/root-landing/ui/landing-hero.tsx`
- `widgets/root-landing/ui/thematic-foundations.tsx`
- `widgets/root-landing/ui/latest-notes.tsx`
- `entities/document/ui/latest-note-row.tsx`

## Related Docs

- `docs/architecture/docs-heapforge-alignment-checklist.md`
- `docs/todo/platform-improvement-todo.md`
