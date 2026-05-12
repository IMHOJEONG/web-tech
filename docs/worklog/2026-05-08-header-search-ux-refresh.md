# 2026-05-08 Header Search UX Refresh

## 요약

- 헤더 검색창을 inline expanding input에서 floating search panel 형태로 변경했다.
- 모바일에서 input이 잘리던 문제를 줄이고, 아이콘 클릭이 곧바로 submit으로 이어지지 않도록 동작을 분리했다.

## 변경 내용

- 검색 아이콘은 이제 toggle 전용 버튼이다.
- 실제 검색 입력은 작은 패널 안에서 처리한다.
- 같은 경로/같은 검색어로 다시 `router.push()`하지 않도록 막았다.
- 검색어 clear 버튼과 `Escape` 닫기 동작을 추가했다.
- `search.input.clearAriaLabel` 메시지를 ko/en에 추가했다.

## 이유

- 기존 구조는 아이콘 클릭이 focus와 submit 역할을 동시에 가져가서 불필요한 리렌더처럼 느껴질 수 있었다.
- 모바일 폭에서는 `group-focus-within` 기반 inline 확장 input이 쉽게 잘렸다.
- 검색 input이 헤더 레이아웃을 직접 밀지 않는 쪽이 shell UX에 더 안정적이다.
