# 2026-05-14 UI/UX 모바일 가로 스크롤 디버깅

## 요약

- `/ui-ux` 페이지에서 모바일 화면일 때 가로 스크롤이 생기던 원인을 다시 정리했다.
- 처음에는 newsletter 영역 텍스트와 카드 폭만 의심했지만, 실제로는 모바일에서 줄어들지 않는 CTA와 입력/버튼 조합이 함께 영향을 주고 있었다.
- 배포 후 재확인 기준으로 `w-full`, `min-w-0`, `max-w-full`, 모바일 전용 padding/tracking 축소를 다시 반영했다.

## 실제 원인

이번 케이스에서 가로 스크롤을 만든 주요 후보는 아래와 같았다.

- newsletter input이 flex row 안에서 충분히 줄어들지 않는 상태
- newsletter 버튼의 `min-w-40`
- 하단 `LOAD NEXT ENTRIES` 버튼의 `inline-flex + px-10 + tracking-[0.24em]`
- featured card 하단 action row의 `inline-flex` 구조
- 상위 grid 안에서 `min-w-0`가 명시되지 않은 컬럼/카드

즉 바깥 page shell보다, 안쪽의 `줄어들지 않는 자식 요소`가 실제 렌더 폭을 밀어내고 있었다.

## 왜 개발자 도구에서 바로 안 보였는가

이번 문제는 `스크롤이 생기는 위치`와 `실제 원인 요소`가 달라서 바로 발견하기 어려웠다.

- overflow는 상위 래퍼나 `body`에서 발생한다.
- 하지만 실제 원인은 더 안쪽의 버튼, 입력창, CTA 텍스트 조합에 있다.
- flex/grid에서는 자식의 `min-width: auto`가 눈에 잘 띄지 않는다.
- `tracking`, `inline-flex`, 큰 horizontal padding은 box model만 봐서는 바로 문제처럼 보이지 않을 수 있다.
- 모바일 breakpoint에서만 터지면 desktop devtools로는 원인을 놓치기 쉽다.

## 적용한 조치

- `main.docs-shell`에 `overflow-x-clip` 추가
- 해당 두 grid section에 `min-w-0` 추가
- featured action row에 `max-w-full flex-wrap` 추가
- newsletter card에 `min-w-0` 추가
- newsletter input에 `min-w-0` 추가
- newsletter 버튼은 모바일에서:
  - `w-full`
  - `min-w-0`
  - tracking 축소
  - `sm` 이상에서만 `min-w-40`
- 하단 CTA는 모바일에서:
  - `max-w-full`
  - `px-6`
  - `py-5`
  - tracking 축소
  - 텍스트 `whitespace-normal` + `break-keep`

## 메모

- 모바일 가로 스크롤은 wrapper보다 `안쪽의 줄어들지 않는 자식`을 먼저 의심하는 편이 빠르다.
- 특히 `flex row + min-width + large tracking + CTA` 조합은 같은 문제가 반복되기 쉬우므로 공용 점검 항목으로 볼 가치가 있다.
