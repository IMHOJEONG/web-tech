# 2026-08-28 Docs Responsive Overflow Smoke Test

## 배경

`/docs` 모바일 화면에서 텍스트가 잘리고 가로 스크롤바가 생기는 회귀가 확인되었다.

수동 확인만으로는 같은 문제가 다시 들어왔을 때 놓치기 쉬우므로, 실제 브라우저 viewport 기반 smoke test를 추가한다.

## 추가한 테스트

- `apps/docs/playwright.config.ts`
- `apps/docs/e2e/horizontal-overflow.spec.ts`

## 테스트 범위

Chromium 기준으로 아래 viewport를 확인한다.

- mobile: `390 x 844`
- tablet: `768 x 1024`

검사 route:

- `/docs`
- `/docs?q=Accessibility`
- 긴 검색어가 들어간 `/docs?q=...`
- `/docs?section=web&source=all&sort=latest`
- `/feed`
- `/web`
- `/about`

## 검사 기준

각 route에서 아래 조건을 확인한다.

- `document.documentElement.scrollWidth <= window.innerWidth + 1`
- `document.body.scrollWidth <= window.innerWidth + 1`
- 실패 시 viewport 오른쪽 또는 왼쪽으로 튀어나간 주요 element 정보를 함께 출력

실패 시 어떤 element가 overflow를 만들었는지 빠르게 볼 수 있도록 tag, class, text 일부, rect 정보를 assertion message에 포함한다.

## 운영 기준

테스트 실행 시 원격 콘텐츠 서버 상태에 영향을 받지 않도록 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`로 실행한다.

목표는 원격 데이터 품질 검증이 아니라 `docs` 앱의 shell/layout 회귀를 잡는 것이다.

## 첫 실행 결과

초기 실행에서 `/docs` 계열 route는 통과했지만, `/feed` mobile viewport에서 body overflow가 감지되었다.

리포트상 원인은 hero 우측 비주얼의 장식용 blur element였다.

- `absolute -left-8 bottom-0 size-40`
- `absolute -right-8 top-0 size-48`

두 element가 viewport 바깥 rect를 만들면서 `body.scrollWidth`가 `390px`에서 `406px`로 늘어났다.

조치:

- `/feed` hero visual wrapper에 `overflow-hidden`과 clipping radius를 추가해 장식 레이어가 body 폭 계산을 밀지 않게 했다.

이후 `scrollWidth`는 정상화되었지만, clipped decorative element의 `getBoundingClientRect()`는 여전히 viewport 바깥 좌표를 반환할 수 있었다.

따라서 테스트의 pass/fail 기준은 실제 horizontal scrollbar를 만드는 `scrollWidth`로 고정하고, element rect 목록은 실패 분석용 리포트로만 유지한다.

## 최종 검증

아래 명령으로 mobile/tablet viewport 총 `14`개 케이스가 통과했다.

```bash
CI=true pnpm --filter docs test:e2e
```

결과:

- `chromium-mobile`: `/docs`, `/docs?q=Accessibility`, 긴 검색어, 필터 조합, `/feed`, `/web`, `/about` 통과
- `chromium-tablet`: 같은 route 세트 통과
