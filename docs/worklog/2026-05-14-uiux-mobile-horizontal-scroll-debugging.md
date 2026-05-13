# 2026-05-14 UI/UX 모바일 가로 스크롤 디버깅

## 요약

- `/ui-ux` 페이지에서 모바일 화면일 때 가로 스크롤이 생기던 원인을 정리했다.
- 문제는 바깥 grid나 page shell 자체보다, 안쪽의 `줄어들지 않는 자식 요소`에 더 가까웠다.
- 특히 CTA 버튼과 input/button row처럼 `intrinsic width`를 갖는 요소가 모바일 폭보다 넓어지면서 페이지 전체 폭을 밀어내고 있었다.

## 원인

이번 케이스에서 가로 스크롤을 만든 주요 후보는 아래와 같았다.

- newsletter 버튼의 `min-w-40`
- 하단 CTA의 큰 `px-10`
- `inline-flex` 기반 버튼 구조
- 큰 `tracking`
- 텍스트 줄바꿈이 잘 일어나지 않는 구조
- flex row 안에서 자식이 기본 `min-width: auto`를 유지하는 상태

즉 상위 컨테이너는 정상처럼 보여도, 안쪽 자식이 실제 렌더 폭을 더 크게 차지하면서 `body` 쪽에 가로 스크롤이 생기는 구조였다.

## 왜 개발자 도구에서 바로 안 보였는가

이번 문제는 `스크롤이 생기는 위치`와 `실제 원인 요소`가 달라서 바로 발견하기 어려웠다.

- overflow는 상위 래퍼나 `body`에서 발생한다.
- 하지만 실제 원인은 더 안쪽의 버튼, 입력창, 텍스트 조합에 있다.
- flex/grid 레이아웃에서는 자식의 `min-width: auto`가 숨어 있는 경우가 많다.
- `tracking`, `inline-flex`, 큰 horizontal padding은 box model만 봐서는 문제로 드러나지 않을 수 있다.
- 모바일 breakpoint에서만 재현되면 desktop devtools만으로는 이상이 약하게 보일 수도 있다.

## 적용한 조치

- newsletter input에 `min-w-0` 추가
- newsletter 버튼은 모바일에서 `w-full min-w-0`, `sm` 이상에서만 고정 최소 너비 사용
- 하단 `LOAD NEXT ENTRIES` 버튼은 모바일에서 padding과 tracking을 축소
- CTA 텍스트는 `whitespace-normal`과 `break-keep`으로 줄바꿈 가능하게 조정

## 메모

- 모바일 가로 스크롤은 wrapper보다 `안쪽의 줄어들지 않는 자식`을 먼저 의심하는 편이 빠르다.
- 특히 `flex row + min-width + large tracking + CTA` 조합은 같은 문제가 반복되기 쉬우므로 공용 점검 항목으로 볼 가치가 있다.
