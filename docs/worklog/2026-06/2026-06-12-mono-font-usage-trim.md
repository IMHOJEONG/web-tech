# 2026-06-12 mono font 사용 범위 정리

## 작업 내용

- `apps/docs`에서 `font-mono` 사용 범위를 다시 정리했다.
- 코드 블록, inline code, terminal-like 패널처럼 실제로 monospace 의미가 있는 영역은 유지했다.
- 사람 정보, hero 보조 라벨, 장식성 메타 텍스트처럼 monospace가 꼭 필요하지 않은 영역은 일반 display 계열로 되돌렸다.

## 이번에 변경한 곳

- 모바일 drawer의 프로필 역할 텍스트
- `About` hero 우측 보조 라벨
- article detail 코드 셸 헤더의 보조 액션 라벨

## 유지한 곳

- MDX code block / inline code
- Shiki code block
- `About` 카드 안 terminal 스타일 패널
- article detail 내부 실제 코드 예시 `pre`

## 판단 기준

- 정보 성격이 “코드/터미널/기술 표기”에 가까우면 `font-mono` 유지
- 정보 성격이 “소개/메타/보조 카피”에 가까우면 일반 display/body 계열 우선
