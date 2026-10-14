# 모바일 문서 H1 크기 검증

## 대상과 조건

- 날짜: 2026-10-14 Asia/Seoul. 기준: 게시 커밋 d5d9454 위의 분리 작업 트리.
- 대상: HTTP 스트리밍·백프레셔 두 공개 글의 문서 H1.
- CSS: max-width 639px에서 2rem·줄 높이 1.2. 기본 root 16px에서 32px이며 큰 기본 글자 설정에 비례합니다.
- Chromium의 320/390/430/639/640/1280px viewport와 390px의 root 32px 모의 조건입니다. 실기기나 브라우저 설정 자체 변경은 아닙니다.

## 재현 방법

분리 작업 트리에서 pnpm --filter docs build 후 production 서버를 3006 포트로 실행했습니다. 점검용 /private/tmp/http-mobile-title/check.cjs가 각 viewport에서 실제 계산 스타일·본문 제목·헤더 위치·페이지 넘침을 확인합니다.

## 결과와 증거

운영용 빌드가 통과했습니다. 두 글×6개 viewport와 390px의 큰 root 글자 모의 조건 2개, 총 14개 조건이 통과했습니다.

- 모바일 제목 32px·줄 높이 38.4px, 640px에서는 기존 38.4px·44.16px, 1280px에서는 기존 64px·73.6px을 확인했습니다.
- HTTP 글의 390px 제목은 3줄·약 132.47px에서 2줄·약 76.78px로 줄었습니다. 320px에서는 3줄·약 115.17px입니다.
- 큰 root 글자 모의 조건에서는 H1이 64px로 비례해 커지고 제목이 헤더 아래에 표시됩니다.
- 기본·큰 글자 조건 모두 헤더 겹침·페이지 가로 넘침·pageerror가 없었습니다.
- [실제 로컬 측정](../artifacts/2026-10-14-mobile-title-local.json), [모바일 화면](../artifacts/2026-10-14-mobile-title-local-390.jpg), [데스크톱 화면](../artifacts/2026-10-14-mobile-title-local-1280.jpg).

공개 배포 성공은 후속 관측 전까지 추정하지 않습니다.

## 한계와 후속 작업

표본은 두 글·Chromium이며 실기기 Safari는 미검증입니다. root 글자 모의 검사는 rem의 배율과 헤더 배치를 확인한 것으로 실제 브라우저의 확대·기본 글자 환경 전체를 보장하지 않습니다. 본문 코드와 그림은 변경하지 않았습니다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-14-mobile-article-title.md)
