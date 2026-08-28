# 2026-08-28 Docs Mobile Overflow Fix

## 배경

`/docs` 모바일 화면에서 검색 결과 제목이 오른쪽으로 잘리고, 페이지 하단에 가로 스크롤바가 생기는 문제가 확인되었다.

첨부 스크린샷 기준으로 주요 증상은 아래와 같았다.

- 검색 결과 hero 제목이 카드 폭을 넘어가며 잘림
- 추천 검색어와 필터 pill 줄이 화면 바깥으로 확장
- `/docs` 인덱스 화면 자체에 viewport-level horizontal scroll 발생

## 원인

`/docs`는 검색/색인 화면이라 긴 검색어, 긴 영문 제목, 여러 필터 pill이 한 화면에 같이 나타난다.

이 구조에서 아래 조건이 겹치면 모바일 폭을 쉽게 넘을 수 있다.

- grid/flex 자식에 `min-w-0`이 없어 콘텐츠가 부모 폭보다 작아지지 못함
- 긴 제목에 명시적인 wrap 정책이 없어 한 줄 콘텐츠처럼 동작함
- filter/recommendation row가 `overflow-x-auto`와 `shrink-0` 조합으로 viewport보다 넓어짐
- section header가 모바일에서도 `justify-between` 양끝 정렬을 유지해 제목과 CTA가 서로 폭을 압박함

## 조치

- `html`, `body`에 `max-width: 100%`와 `overflow-x: clip`을 추가해 viewport-level overflow를 차단했다.
- `DocsSearchPanel`에 `min-w-0`, `max-w-full`, `break-keep`, `[overflow-wrap:anywhere]`를 적용했다.
- 추천 검색어 row를 horizontal scroll 대신 wrapping pill 구조로 변경했다.
- `DocsIndexControlsBar`의 section/source/sort filter row를 wrapping pill 구조로 변경했다.
- `DocsIndexControlPill`은 부모 폭을 넘지 않도록 `max-w-full`과 내부 `truncate`를 적용했다.
- `/docs` section header는 모바일에서 세로로 쌓고, `sm` 이상에서만 양끝 정렬되도록 변경했다.
- `DocsIndexCard` 제목과 요약에 wrap 정책을 추가해 긴 검색어/영문 제목이 카드 폭을 밀지 않게 했다.

## 확인 포인트

수동 확인 시 아래 viewport를 우선 확인한다.

- `375px` width: iPhone SE/mini 계열
- `390px ~ 430px` width: 일반 iPhone/Android
- `640px ~ 767px` width: mobile shell과 tablet layout 경계

확인 항목:

- `/docs?q=Accessibility`
- `/docs?q=longlonglonglonglonglonglongkeyword`
- `/docs?section=web&source=all&sort=latest`
- 페이지 하단에 가로 스크롤바가 생기지 않는지
- 검색 결과 제목이 카드 내부에서 줄바꿈되는지
- filter pill이 잘리지 않고 다음 줄로 넘어가는지

## 후속 후보

- 모바일 전용 `/docs` 검색 패널은 hero headline을 더 작게 낮출지 검토한다.
- 추천 검색어 pill이 많아질 경우 `Show more` 패턴을 검토한다.
- Playwright viewport smoke test에서 `document.documentElement.scrollWidth <= window.innerWidth` 검사를 추가할 수 있다.
