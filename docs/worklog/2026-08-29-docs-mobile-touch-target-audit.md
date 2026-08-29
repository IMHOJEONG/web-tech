# Docs Mobile Touch Target Audit

## 배경

`/docs` 모바일 화면은 검색, 추천 키워드, 필터, 페이지네이션처럼 작은 조작 요소가 많다.

가로 overflow는 이미 줄였지만, 모바일 사용성 관점에서는 요소가 화면 안에 들어오는 것만으로 충분하지 않다. 사용자가 손가락으로 눌렀을 때 실수하지 않도록 주요 interactive target의 최소 크기를 맞춰야 한다.

## 적용 내용

- `/docs` 검색 submit 버튼에 최소 `44px` 터치 높이를 적용했다.
- 추천 키워드 링크를 `inline-flex` 기반 pill로 바꾸고 최소 `44px` 높이를 적용했다.
- `section/source/sort` 필터 pill에 최소 `44px` 높이와 공통 focus ring을 적용했다.
- 문서 카드, 섹션 카드, 보조 CTA, pagination 링크에 공통 focus ring을 적용했다.
- pagination 숫자 버튼은 `size-9`에서 `size-11`로 키워 최소 터치 크기를 맞췄다.
- Playwright에서 `/docs` 주요 touch target이 `44px` 미만으로 줄어들지 않는지 확인하는 smoke test를 추가했다.

## 기준

모바일에서 사용자가 직접 누르는 주요 요소는 최소 `44px` 이상의 width/height를 유지한다.

다만 문장 안에 포함된 일반 텍스트 링크까지 전부 같은 기준으로 강제하지는 않는다. 이번 기준은 `/docs` 인덱스의 주요 조작 요소에 한정한다.

## 자동화

추가한 테스트:

```bash
CI=true pnpm --filter docs test:e2e
```

대상:

- `/docs`
- `/docs?q=Accessibility`

검사:

- `[data-touch-target="docs-index"]`를 가진 visible 요소의 width/height가 `44px` 이상인지 확인한다.

## 후속 후보

- 실제 iOS Safari에서 safe area와 bottom nav가 pagination 영역을 가리지 않는지 확인한다.
- keyboard tab 순서가 검색 입력, 추천 키워드, 필터, 카드, pagination 순서로 자연스러운지 점검한다.
- `/feed`, `/web`, `/mobile`, `/ui-ux`의 필터/카드 touch target에도 같은 테스트 표식을 확장할지 검토한다.
