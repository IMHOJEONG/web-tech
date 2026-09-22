# 2026-05-25 Knowledge 공간 보강

## 요약

- 최근 커밋 기록과 기존 worklog를 기준으로 `docs/knowledge/`를 실제 온보딩 문서 수준으로 보강했다.
- 단순 개요 수준이던 내용을 아래 관점으로 확장했다.
  - 배운 점
  - 자주 헷갈리는 부분
  - 현재 운영 기준
  - 구현하면서 반복 확인한 패턴
  - 다음 작업자가 먼저 점검할 것

## 반영한 파트

- `docs/knowledge/docs-app/README.md`
- `docs/knowledge/content-platform/README.md`
- `docs/knowledge/design-system/README.md`
- `docs/knowledge/infra-tooling/README.md`

## 이번에 특히 반영한 내용

- `docs app`
  - `/feed`, `/docs`, 채널 허브, 모바일 drawer의 정보구조 기준
  - 문서 읽기 화면에서 반복적으로 문제가 됐던 header, TOC, body background, 상단 여백 관찰 포인트
- `content platform`
  - `markdownPath / slug / id` 역할 분리
  - server-to-server 인증과 publish/read 경로 분리
  - asset host, 이미지 ownership, 원격 HTML 후처리 기준
- `design system`
  - code block contrast, search panel, TOC, overlay 계층에서 얻은 교훈
  - `sm / md / lg` 반응형 기준과 shell/content 분리 관점
- `infra / tooling`
  - `pnpm` 재검증
  - `next.config` build-time env 해석
  - `remotePatterns`, asset host, 배포 env 점검 순서

## 메모

- 이번 보강의 목적은 “작업 기록을 남긴다”보다 “다음 작업자가 같은 시행착오를 줄인다”에 가깝다.
- 앞으로도 worklog에만 반복해서 등장하는 내용은 적절한 시점에 `docs/knowledge/`로 승격하는 편이 좋다.
