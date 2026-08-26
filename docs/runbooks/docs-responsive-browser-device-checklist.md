# Docs Responsive Browser / Device Checklist

이 문서는 `apps/docs`의 반응형 UI를 브라우저별, 기기별로 점검하기 위한 수동 QA 기준이다.

## 목적

`640px ~ 1023px` 구간은 모바일과 데스크톱 사이에 있는 가장 애매한 영역이다.

이 구간에서는 아래 문제가 자주 생긴다.

- header는 desktop처럼 바뀌었는데 콘텐츠는 mobile 밀도를 유지함
- bottom nav와 desktop nav가 동시에 보임
- drawer가 사라졌는데 터치 가능한 대체 탐색이 부족함
- 카드가 너무 빨리 multi-column으로 바뀌어 본문 가독성이 떨어짐
- sticky header 아래로 본문 또는 anchor scroll 대상이 겹침

## 기준 브라우저

최소 점검 브라우저:

- Chrome 최신 stable
- Safari 최신 stable
- Firefox 최신 stable

가능하면 추가 점검:

- iOS Safari
- Android Chrome
- macOS Safari responsive design mode

## 기준 viewport

필수 viewport:

- `375 x 812`
  - 일반 모바일 기준
- `430 x 932`
  - 큰 모바일 기준
- `640 x 900`
  - `sm` 진입 직후
- `768 x 1024`
  - 태블릿 portrait 기준
- `820 x 1180`
  - iPad Air portrait 기준
- `1023 x 768`
  - `lg` 진입 직전 최대 구간
- `1024 x 768`
  - `lg` 진입 직후
- `1280 x 800`
  - 일반 노트북 기준

## 공통 확인 방법

1. 개발 서버를 실행한다.

```bash
pnpm dev:docs
```

2. 브라우저 개발자 도구에서 Device Toolbar를 연다.

3. 위 viewport를 하나씩 입력한다.

4. 아래 라우트를 순서대로 확인한다.

```text
/
/feed
/feed?topic=web
/docs
/docs?q=react
/docs?section=web&source=local
/web
/mobile
/ui-ux
/about
/docs/web/javascript-event-loop-runtime
```

5. 각 viewport에서 hard refresh를 1회 수행한다.

6. 첫 로드, 스크롤 중, drawer/search open 상태를 각각 확인한다.

## Shell 체크리스트

### Header

- `< 640px`에서는 hamburger, brand, search가 잘 보인다.
- `< 640px`에서는 desktop navigation이 보이지 않는다.
- `640px ~ 1023px`에서는 desktop navigation이 보인다.
- `640px ~ 1023px`에서는 hamburger drawer와 bottom nav가 보이지 않는다.
- 검색 아이콘과 theme toggle이 서로 겹치지 않는다.
- sticky header 아래로 본문이 겹치지 않는다.
- anchor 이동 시 제목이 header에 가려지지 않는다.

### Mobile Drawer

- drawer trigger는 `< 640px`에서만 보인다.
- drawer 폭이 작은 기기에서 화면을 넘지 않는다.
- drawer 내부 링크를 누르면 drawer가 닫힌다.
- close button은 키보드와 터치 모두로 접근 가능하다.
- active route 표현이 현재 경로와 맞다.

### Bottom Nav

- bottom nav는 `< 640px`에서만 보인다.
- footer 링크와 bottom nav가 시각적으로 중복되어 혼란스럽지 않다.
- safe area가 있는 기기에서 버튼이 하단에 잘리지 않는다.
- active route 표현이 현재 경로와 맞다.

## Page 체크리스트

### `/docs`

- 검색 패널이 모바일에서 너무 높지 않다.
- 추천 키워드와 필터 pill이 터치하기 쉬운 크기다.
- `section/source/sort` 컨트롤이 줄바꿈되어도 읽기 순서가 유지된다.
- 검색 결과와 기본 인덱스 화면의 차이가 명확하다.
- pagination 버튼이 작은 화면에서 서로 붙지 않는다.

### `/feed`

- hero 제목과 summary가 한글에서 어색하게 끊기지 않는다.
- 카드 썸네일 비율이 640~1023px에서 과하게 커지지 않는다.
- 필터 버튼이 한 줄을 넘겨도 터치하기 쉽다.
- 큐레이션 카드가 tablet에서 너무 빨리 multi-column으로 바뀌지 않는다.

### Article Detail

- TOC는 `lg` 이상에서만 sidebar로 보인다.
- `lg` 미만에서는 본문 폭이 안정적으로 유지된다.
- h1/h2 anchor 이동 시 sticky header에 가려지지 않는다.
- 코드 블록은 가로 스크롤이 가능하고 본문 레이아웃을 밀어내지 않는다.
- 이미지와 figcaption이 중앙 정렬되고 화면을 넘지 않는다.

### Channel Hub / About

- hero card가 640~1023px에서 과하게 높지 않다.
- stat card 또는 panel grid가 너무 빨리 3열로 바뀌지 않는다.
- 한글 문장이 좁은 폭에서 한 글자씩 떨어지지 않는다.
- CTA와 보조 링크가 터치 가능한 크기다.

## 정적 코드 점검 기준

아래 패턴은 실제 화면 확인 전에 먼저 의심한다.

- `sm:grid-cols-*`
- `sm:flex-row`
- `sm:p-*`로 카드 밀도를 크게 키우는 패턴
- shell show/hide에 `md:hidden`, `md:block`을 섞는 패턴
- 640~1023px에서 `md:grid-cols-3`로 너무 빨리 다열화되는 패턴

검색 예시:

```bash
rg -n "sm:grid-cols|sm:flex-row|md:grid-cols|md:hidden|md:block" apps/docs/widgets apps/docs/app
```

## 자동화 후보

초기에는 수동 QA로 충분하다. 다만 회귀가 반복되면 Playwright 기반 visual/smoke test를 추가한다.

자동화 후보:

- viewport별 route smoke test
- header/drawer/bottom nav visibility assertion
- screenshot diff
- anchor scroll 후 heading visibility assertion

도입 시 우선순위:

1. route smoke test
2. shell visibility assertion
3. article anchor visibility assertion
4. screenshot diff
