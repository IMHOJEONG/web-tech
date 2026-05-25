# Docs App 지식 정리

## 배운 점

- `/feed`와 `/docs`는 같은 목록이 아니라 서로 다른 목적의 화면이다.
  - `/feed`: 큐레이션
  - `/docs`: 인덱스와 검색 컨텍스트
- `/web`, `/mobile`, `/ui-ux`는 상세 showcase보다 채널 허브로 보는 편이 IA에 맞다.
- 모바일과 desktop의 1차 내비게이션 구조는 같은 목적지 집합을 유지해야 한다.
- 상세 문서 화면은 “보이는 효과”보다 “읽기 리듬”이 우선이다.
  - sticky header
  - TOC
  - 본문 상단 여백
  - 배경 surface
    이 네 가지가 조금만 어긋나도 읽는 경험이 바로 어색해진다.
- `/ui-ux`는 generic hub로 다루기보다, Figma 기준의 별도 editorial hub로 보는 편이 더 자연스럽다.

## 자주 헷갈리는 부분

- `/docs`는 메인 탭이 아니라 인덱스/검색 레이어에 가깝다.
- 문서 상세는 로컬 MDX와 원격 HTML 두 경로가 공존한다.
- `640px ~ 1023px` 구간은 shell은 desktop처럼 보이지만 content는 아직 단일 컬럼 리듬을 유지해야 한다.
- 검색 결과는 별도 `/search` 라우트가 아니라 `/docs?q=...` 상태로 해석한다.
- 모바일 drawer에서 `/docs`를 1차 목적지처럼 올리면 desktop IA와 어긋난다.
- `/web`, `/mobile`, `/ui-ux`는 “상세 시안”을 바로 보여주는 라우트가 아니라 “주제 허브”라는 점을 잊기 쉽다.

## 현재 운영 기준

- primary nav: `Feed / Web / Mobile / UI/UX / About`
- 콘텐츠 밀도 전환: `lg`
- shell 전환: `sm`
- `/docs/{channel}/{articleSlug}` 형태의 공개 상세 경로 사용
- 검색 결과 상태: `/docs?q=...`
- 모바일 drawer 1차 내비게이션도 desktop과 동일하게 유지
  - `Feed / Web / Mobile / UI/UX / About`
- 홈 `/`는 전체 실패보다 section 단위 graceful degradation을 우선 적용
  - 예: `latest notes` 실패 시 홈 전체를 죽이지 않고 섹션만 비움

## 구현하면서 반복 확인한 패턴

- IA를 먼저 문서로 확정한 뒤 화면을 바꾸는 편이 시행착오가 적었다.
  - `/feed`와 `/docs`를 먼저 분리 정의
  - 그다음 `/web`, `/mobile`, `/ui-ux` 허브화
  - 마지막으로 `/ui-ux` 전용 허브 고도화
- 읽기 화면에서 시각적으로 “좋아 보이는” 효과가 항상 UX를 개선하지는 않았다.
  - 반투명 header
  - fixed TOC
  - body gradient
    같은 요소는 screenshot상 좋아 보여도 실제 스크롤에서는 문제를 만들었다.
- 검색은 단순히 결과만 나오는 기능이 아니라 shell UX와 직접 연결된다.
  - 아이콘 클릭이 submit처럼 느껴지지 않도록 분리
  - 모바일에서 잘리지 않는 패널형 구조
  - 긴 검색어는 말줄임 처리

## 다음 작업자가 먼저 점검할 것

- 새 라우트를 추가할 때
  - 이 화면이 `큐레이션`, `인덱스`, `주제 허브`, `상세` 중 어디에 속하는지 먼저 정리
- 문서 상세를 건드릴 때
  - header 겹침
  - TOC 위치
  - 본문 상단 여백
  - body/background surface
    네 가지를 함께 확인
- 모바일 내비게이션을 수정할 때
  - desktop 1차 목적지와 같은 집합인지 먼저 확인
- `/feed`나 `/docs` 검색 UX를 바꿀 때
  - 같은 검색어/같은 경로 중복 push가 없는지 확인

## 먼저 보면 좋은 문서

- `docs/architecture/docs-app-information-architecture.md`
- `docs/architecture/docs-feed-and-docs-routing-policy.md`
- `docs/architecture/docs-responsive-policy.md`
- `docs/architecture/docs-content-routing-policy.md`
- `docs/architecture/docs-search-experience-policy.md`
- `docs/worklog/2026-05-05-docs-feed-and-docs-routing.md`
- `docs/worklog/2026-05-05-docs-search-experience.md`
- `docs/worklog/2026-05-08-channel-hub-layout-conversion.md`
- `docs/worklog/2026-05-08-uiux-hub-figma-alignment.md`
- `docs/worklog/2026-05-09-mobile-drawer-navigation-alignment.md`
- `docs/worklog/2026-05-25-docs-widget-responsive-audit.md`
