# ADR-0001: Docs Feed Main Composition

- Status: Accepted
- Date: 2026-04-29

## Context

`apps/docs/app/docs/page.tsx`는 기존에 단순 카드 리스트를 렌더링하고 있었고, `/feed`는 별도의 허브 페이지 구조를 사용하고 있었습니다.

한편 Figma 기반으로 만든 `MainFeed`는 다음 섹션을 가진 메인 피드 레이아웃을 전제로 합니다.

- Hero
- Latest insights grid
- Newsletter call-to-action

## Decision

다음과 같이 정리합니다.

- `MainFeed`는 `apps/docs/widgets/main-feed/ui/main-feed.tsx`에서 본문 전용 컴포넌트로 관리합니다.
- `/docs` 기본 페이지와 `/feed` 탭 모두 `MainFeed`를 사용합니다.
- 글로벌 header/footer는 기존 app shell이 담당하고, `MainFeed`는 메인 콘텐츠만 담당합니다.

## Consequences

장점:

- 피드 경험이 `/docs`와 `/feed`에서 일관됩니다.
- Figma 기반 메인 피드 구조를 한 컴포넌트에서 재사용할 수 있습니다.
- 향후 카드 배치/CTA/섹션 조정이 단일 진입점에서 가능합니다.

주의:

- `MainFeed`는 현재 문서 데이터 개수가 적을 때 placeholder 카드가 섞여 보일 수 있습니다.
- 카테고리 필터 버튼은 현재 시각 요소이며, 실제 필터 동작은 아직 연결되지 않았습니다.

## Follow-up

- `MainFeed` 카드 구성을 실제 category metadata 기반으로 정교화
- 필터 버튼 동작 연결
- footer/newsletter 섹션을 독립 컴포넌트로 분리할지 검토
