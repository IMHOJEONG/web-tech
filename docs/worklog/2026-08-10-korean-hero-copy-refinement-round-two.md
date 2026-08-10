# 2026-08-10 한국어 hero 카피 2차 정리

## 작업 범위

- `/` root landing hero
- `/about` hero
- `/about` pillar / profile 소개 문구

## 왜 다시 다듬었나

- 기존 문구도 1차 정리는 되어 있었지만, 몇몇 표현은 여전히 번역체 느낌이 남아 있었다.
- 이번에는 “멋있어 보이는 표현”보다 “실제 소개 문장처럼 자연스럽게 읽히는가”를 더 우선했다.

## 이번에 바꾼 기준

- `정교한 구현`, `구조로 엮습니다`처럼 추상적이거나 다소 번역투로 느껴질 수 있는 표현을 줄였다.
- root landing과 `/about`가 같은 프로젝트를 말하고 있다는 톤이 더 자연스럽게 이어지도록 정리했다.
- profile 소개 문구는 자기소개처럼 읽히되, `HEAP-FORGE`가 기록 아카이브라는 점이 바로 드러나게 맞췄다.

## 반영 내용

`apps/docs/shared/message/ko.json`

- root landing hero headline / description / CTA 조정
- `about.hero` headline / description / mission label 조정
- `about.pillars`의 한국어 headline / body 문장 다듬기
- `about.profile.bio`를 더 자연스러운 자기소개 톤으로 조정

## 메모

- 이번 변경은 `landing / hero 계열 카피` 전체 완료가 아니라, 사용자가 자주 먼저 접하는 root/about 구간을 한 번 더 정리한 단계다.
- 이후 `/web`, `/mobile`, `/ui-ux` 허브 카피도 같은 기준으로 다시 맞출 수 있다.
