# Design System 지식 정리

## 배운 점

- 디자인 토큰은 컴포넌트별 하드코딩보다 공용 shell과 surface 계층에서 먼저 정리하는 편이 효율적이다.
- 코드 블록, TOC, 검색 패널처럼 “작은 표면”도 라이트/다크 모두에서 실제 대비를 확인해야 한다.
- `article-detail` 같은 읽기 화면은 시각 효과보다 읽기 리듬과 배경 레이어 안정성이 더 중요하다.
- 원격 HTML을 받는 화면은 “문법 파싱”보다 “HTML 후처리 + 스타일 레이어” 쪽 설계가 더 중요할 때가 많다.
- 디자인 디테일은 desktop만 맞춰서는 부족하고, 모바일 drawer나 floating search처럼 shell 하위 레이어까지 맞춰야 전체 톤이 안정된다.

## 자주 헷갈리는 부분

- `inverse-*` 토큰은 코드 블록처럼 항상 어두운 배경을 쓰는 영역에 바로 쓰기 어렵다.
- `sm`에서 카드 패딩이나 그리드가 먼저 커지면 shell 정책과 충돌할 수 있다.
- MDX와 원격 HTML은 같은 문서처럼 보여도 스타일 적용 경로가 다르다.
- 반투명 효과나 blur는 screenshot상 예뻐 보여도, 실제 스크롤 중에는 읽기 화면을 불안정하게 만들 수 있다.
- TOC, header, body background 문제는 한 군데만 고쳐서는 해결되지 않고 surface 계층 전체를 같이 봐야 한다.

## 현재 운영 기준

- shell 기준 breakpoint: `sm`
- content density 기준 breakpoint: `lg`
- 코드 표면은 라이트/다크 모두에서 직접 대비를 확인
- 원격 HTML은 필요한 경우 프론트에서 후처리한다.
- 코드 블록은 현재 Shiki 기반을 기본 전제로 본다.
- 원격 HTML 이미지 캡션은 `figure/figcaption`으로 정규화한다.
- 문서 읽기 화면은 과한 overlay보다 단단한 background/surface 구성이 우선이다.

## 구현하면서 반복 확인한 패턴

- 실제 사용성 문제는 “효과가 많아서” 생기는 경우가 많았다.
  - 반투명 header
  - fixed TOC
  - body gradient
  - 코드 표면의 잘못된 contrast
- 검색 패널처럼 작은 UI도 dark mode에서 이중 박스처럼 보이지 않게 surface를 단순화하는 편이 좋았다.
- 코드 블록은 기능보다 대비와 타이포 리듬이 먼저다.
  - light mode에서 안 보이는 문제
  - dark mode에서 또 안 보이는 문제
    를 각각 따로 확인해야 했다.

## 다음 작업자가 먼저 점검할 것

- 새 surface UI를 추가할 때
  - light/dark 대비
  - border 강도
  - shadow 유무
  - backdrop 효과 필요성
    네 가지를 같이 보기
- 문서 본문 스타일을 손볼 때
  - MDX 경로
  - 원격 HTML 경로
    둘 다 같은 수준으로 보이는지 확인
- 코드 블록을 바꿀 때
  - Shiki theme
  - pre/code color inheritance
  - dark mode contrast
    순서로 확인
- 반응형 조정을 할 때
  - shell breakpoint
  - content breakpoint
    를 같은 파일에서 섞어 쓰는지 먼저 점검

## 먼저 보면 좋은 문서

- `docs/architecture/docs-design-token-usage-policy.md`
- `docs/architecture/docs-responsive-policy.md`
- `docs/worklog/2026-05-11-code-block-contrast-fix.md`
- `docs/worklog/2026-05-10-remote-image-figcaption-normalization.md`
- `docs/worklog/2026-05-08-header-search-ux-refresh.md`
- `docs/worklog/2026-05-11-shiki-migration.md`
- `docs/worklog/2026-05-25-docs-widget-responsive-audit.md`
