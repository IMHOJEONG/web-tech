# 2026-05-08 Channel Hub Layout Conversion

## 요약

- `/web`, `/mobile`, `/ui-ux`가 공용 `ArticleDetail` showcase를 직접 렌더하던 구조를 중단했다.
- 세 채널은 이제 `HubPage` 기반의 탐색 허브를 사용한다.
- page 엔트리는 얇게 유지하고, 채널별 데이터 조합과 카피는 `widgets/content-hub`로 이동했다.

## 이유

- 기존 구조는 채널 라우트가 곧바로 상세 기사 시안을 보여줘서 실제 문서 탐색 흐름과 맞지 않았다.
- 로컬 Figma 기준 `UI/UX Category - HEAPFORGE Branding` 계열 화면처럼, 채널은 먼저 허브/리스트 역할을 해야 전체 IA가 자연스럽다.
- `/feed`는 큐레이션, `/docs`는 인덱스, `/web|/mobile|/ui-ux`는 주제 허브라는 구분을 실제 화면에도 반영할 필요가 있었다.

## 변경 내용

- `apps/docs/app/web/page.tsx`
- `apps/docs/app/mobile/page.tsx`
- `apps/docs/app/ui-ux/page.tsx`
  - 모두 `ChannelHubPage`를 렌더하도록 변경
- `apps/docs/widgets/content-hub/model/get-channel-hub-docs.ts`
  - 채널별 문서 목록 생성
  - `SearchData` 기반으로 `href`를 포함한 혼합 문서 목록 사용
- `apps/docs/widgets/content-hub/ui/channel-hub-page.tsx`
  - 채널별 hero, stats, panels, latest docs 조합
- `apps/docs/widgets/content-hub/ui/hub-page.tsx`
  - latest section copy와 action link를 props로 받도록 확장
- `apps/docs/lib/get-doc-channel.ts`
  - `web / mobile / uiux / other` 공용 채널 판정 helper 추가
- `apps/docs/widgets/m/ui/main-feed.tsx`
- `apps/docs/widgets/root-landing/ui/root-landing-page.tsx`
  - 같은 채널 판정 helper를 재사용하도록 정리

## 메모

- `/web`는 `category/fe/*`와 `data/v8/*`를 같이 보여준다.
- `/ui-ux`는 현재 `data/shadcn/*` 기반 문서를 허브에 연결한다.
- `/mobile`은 허브 구조는 먼저 열어두고, 문서가 부족한 동안은 empty state로 운영한다.
