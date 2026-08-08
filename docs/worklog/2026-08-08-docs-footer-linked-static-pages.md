# 2026-08-08 Docs Footer Linked Static Pages

## What Changed

`apps/docs` footer의 placeholder 링크를 실제 정보 페이지와 외부 저장소 링크로 교체했다.

연결 결과:

- `PRIVACY` -> `/privacy`
- `TERMS` -> `/terms`
- `CHANGELOG` -> `/changelog`
- `GITHUB` -> `https://github.com/IMHOJEONG/web-tech`

## Implementation

### 1. Footer Link Wiring

`apps/docs/widgets/app-shell/ui/footer.tsx`

- 내부 라우트와 외부 링크를 구분해서 연결
- 외부 GitHub 링크에는 `target="_blank"`와 `rel="noreferrer noopener"` 적용

### 2. Reusable Static Page Widget

`apps/docs/widgets/static-page/ui/static-page.tsx`

- 정적 정보 페이지용 공통 레이아웃 추가
- hero 영역, section card, sticky aside 구성을 공통으로 사용

### 3. New Static Routes

추가 라우트:

- `/privacy`
- `/terms`
- `/changelog`

각 페이지는:

- locale-aware metadata
- locale-aware body copy
- footer에서 직접 도달 가능한 실제 콘텐츠

를 갖도록 구성했다.

## Why

기존 footer는 링크 텍스트는 있었지만 모두 `#` placeholder라 신뢰감이 떨어졌다.
이번 변경으로:

- footer가 실제 정보 구조를 갖게 되었고
- 정적 페이지도 재사용 가능한 방식으로 추가할 수 있게 되었고
- 운영 문서/정책성 콘텐츠의 진입점이 앱 안에 생겼다.

## Follow-Up

- privacy/terms 문구를 더 법적 톤으로 정리할지 검토
- changelog를 실제 worklog 요약 자동 생성 흐름과 연결할지 검토
