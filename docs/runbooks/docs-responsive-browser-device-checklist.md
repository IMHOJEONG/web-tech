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
/docs?section=web&sort=latest
/web
/mobile
/ui-ux
/about
/docs/web/javascript-event-loop-runtime
```

5. 각 viewport에서 hard refresh를 1회 수행한다.

6. 첫 로드, 스크롤 중, drawer/search open 상태를 각각 확인한다.

## Motion 확인 방법

`motion-layout`, `motion-reveal` 같은 CSS motion은 의도적으로 짧게 적용한다. 빠른 기기에서는 눈에 잘 띄지 않을 수 있으므로 DevTools에서 아래 순서로 확인한다.

### Chrome DevTools

1. DevTools를 연다.

```text
macOS: Cmd + Option + I
Windows/Linux: Ctrl + Shift + I
```

2. Command Menu를 연다.

```text
macOS: Cmd + Shift + P
Windows/Linux: Ctrl + Shift + P
```

3. `Rendering`을 입력하고 `Show Rendering`을 선택한다.

4. 하단 drawer에 열린 `Rendering` 패널에서 `Emulate CSS media feature prefers-reduced-motion`을 찾는다.

5. 아래 값을 번갈아 선택한다.

- `No emulation`: 실제 OS 설정 그대로 확인
- `prefers-reduced-motion: no-preference`: 애니메이션 허용 상태로 확인
- `prefers-reduced-motion: reduce`: 움직임 줄이기 상태로 확인

### 기대 결과

- `no-preference`에서는 `/docs?section=web`, `/docs?sort=latest`, `/feed?topic=web` 이동 시 카드가 짧게 fade-in/up reveal 된다.
- `reduce`에서는 카드 reveal animation이 보이지 않아야 한다.
- `reduce`에서도 레이아웃과 콘텐츠는 동일하게 보여야 한다.

### CSS 적용 여부 확인

Elements 패널에서 카드 또는 패널을 선택한 뒤 class와 computed style을 확인한다.

- `motion-layout`이 있으면 `transition-property`가 적용된다.
- `motion-reveal`이 있으면 `animation-name: docs-motion-reveal`이 적용된다.
- `prefers-reduced-motion: reduce` 상태에서는 `animation: none`, `transition: none`으로 바뀌어야 한다.

### 눈으로 잘 안 보일 때

실제 사용자용 duration은 짧게 유지한다. 확인이 어려울 때만 임시로 duration을 늘려 비교한다.

```css
.motion-reveal {
  animation: docs-motion-reveal 1200ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

확인 후에는 다시 `360ms`로 돌린다.

## Shell 체크리스트

### 키보드와 스크린 리더 검사 순서

1. 페이지를 새로 열고 Tab을 누른다. 첫 포커스에서만 `본문으로 바로가기`가 표시되어야 한다. Enter로 유일한 `main#main-content`에 포커스가 이동하고 다음 Tab은 본문 컨트롤로 이어져야 한다. 제목과 포커스가 고정 헤더 아래에 보여야 한다.
2. 라이트·다크 모드에서 메뉴·검색 입력·지우기·제출 버튼을 키보드로 이동한다. 실선 포커스가 보여야 한다. 일반 글자와 placeholder는 4.5:1, 필요한 아이콘은 3:1 이상을 목표로 검사한다. 장식과 로고 예외를 일반 버튼 글자에 확대 적용하지 않는다.
3. 실제 macOS Safari + VoiceOver, 가능하면 Windows Firefox + NVDA로 아래 수동 검사를 수행한다. 브라우저 접근성 트리·Playwright 통과는 실제 낭독 통과를 의미하지 않는다.

```bash
pnpm --filter docs exec playwright test e2e/skip-link.spec.ts e2e/shell-focus-contrast.spec.ts e2e/keyboard-accessibility.spec.ts
```

스크린 리더 수동 체크리스트:

- [ ] 한국어·영어 페이지에서 언어와 페이지 제목이 적절하게 안내되는가?
- [ ] 랜드마크 목록에 주요 메뉴, 문서 검색, 문서 목록 검색(`/docs`), 본문이 구분되어 나오는가? 데스크톱 메뉴가 링크마다 개별 탐색 영역으로 반복되지 않는가?
- [ ] 제목 목록에서 글 제목 `h1`과 하위 제목을 탐색할 수 있는가?
- [ ] drawer를 열면 이름·설명이 안내되고 배경 링크는 탐색되지 않는가? Escape로 닫으면 열기 버튼으로 돌아오는가?
- [ ] 검색 입력 이름과 지우기·제출 버튼이 구분되는가? 검색 결과 URL로 직접 진입해도 헤더 검색이 자동으로 포커스를 가져가지 않는가?
- [ ] 검색 후 결과 수·빈 결과를 찾아 읽을 수 있고, 클라이언트 페이지 이동 안내가 중복되거나 누락되지 않는가?
- [ ] 뒤로 가기, 화면 회전, 200% 확대 후에도 탐색 순서가 유지되는가?

검사 시 OS·브라우저·스크린 리더 버전, URL, 실제 읽힌 문구와 기대 문구를 함께 기록한다. 낭독을 직접 확인하지 않았다면 반드시 미검증으로 남긴다.

참고: [반복 영역 건너뛰기](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks), [텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [포커스 표시](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).

현재 대비 자동 검사는 단색 배경과 부모 배경의 알파 합성에 한정한다. 이미지·그라디언트·전체 사이트 대비, 실제 강제 색상 OS 테마는 별도 확인한다.

### 검색 제출 회귀 검사

Node 24와 Playwright Chromium을 준비하고 저장소 루트에서 실행한다. 사용 중인 개발 서버와 겹치지 않는 포트를 지정한다.

```bash
DOCS_E2E_PORT=3116 \
DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= \
DOCS_ENABLE_REACT_INSPECTION=false \
mise exec -- pnpm --filter docs test:e2e \
  search-navigation.spec.ts search-query-policy.spec.ts keyboard-accessibility.spec.ts \
  --workers=1 --max-failures=2
```

기본 Playwright 설정은 원격 목록을 끄고 로컬 문서를 사용한다. 한국어·영어의 헤더·본문 폼을 모바일·태블릿·데스크톱 크기에서 검사한다.

- 새 검색은 locale을 유지하면서 필터·페이지를 초기화하고 document reload 없이 결과로 이동해야 한다.
- 같은 검색은 history를 추가하지 않아야 하며 빈 입력·뒤로/앞으로 가기는 URL과 본문 입력값을 복원해야 한다.
- 응답을 지연시키면 제출 버튼이 비활성화되고 폭이 유지되어야 한다. 진행 중 Enter/submit으로 두 번째 요청을 만들지 않아야 한다.
- 40 code point·NFC·공백·합성 IME 정책, Escape 포커스 복원, reduced motion을 확인한다.
- native GET 검사는 실제 폼 markup을 별도 JavaScript 비활성 페이지에 옮겨 제출 계약만 확인한다. 전체 `/docs`의 무-JavaScript 지원을 보증하지 않는다.

실패 시 로컬 fixture에 검색 결과가 있는지, 서버 포트 충돌 여부와 trace를 먼저 확인한다. 문구 기대값을 바꿔 이동·인증·결과 계약을 우회하지 않는다. 실제 OS IME와 스크린리더 낭독은 위 수동 검사로 보완한다. [09-26 검증 결과](../verification/content/2026-09-26-search-navigation.md).

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
- 검색 제출 버튼, 추천 키워드, 필터 pill, 문서 카드, pagination은 최소 `44px` 터치 타깃을 유지한다.
- 터치 가능한 요소에는 `focus-visible` 상태가 보이고 키보드 이동 순서가 시각적 읽기 순서와 크게 어긋나지 않는다.
- `section/sort` 컨트롤이 줄바꿈되어도 읽기 순서가 유지된다.
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
- `/docs` 주요 touch target 최소 크기 assertion
- anchor scroll 후 heading visibility assertion
- screenshot diff

도입 시 우선순위:

1. route smoke test
2. shell visibility assertion
3. `/docs` 주요 touch target 최소 크기 assertion
4. article anchor visibility assertion
5. screenshot diff

현재 자동화된 viewport:

- `chromium-mobile`: `390 x 844`
- `chromium-tablet`: `768 x 1024`
- `chromium-desktop`: `1280 x 800`
