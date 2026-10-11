# 큰 기본 글자 설정의 헤더 보완 검증

## 대상과 조건

- 날짜: 2026-10-11, KST.
- 대상: `feature/docs`, 기준 `9c84c9d` 위의 헤더 보완 작업 트리. 운영 배포 결과가 아니다.
- Node.js 24.12.0, Playwright 1.62.1, Chromium 151.0.7922.34, Next.js 16.3.8.
- 기존 `http://localhost:3001` 개발 서버에서 실행. 사용자 Chrome의 설정/프로필은 변경하지 않았다.
- 기본 글자: 격리 확장 API로 16/32px, 실제 창 폭 500/640/1280px, 한국어/영어의 12개 조건. CSS override 없이 root font와 실제 창 폭을 검사한다.
- 보조 조건: CSS root font 32px, 320/390/500px, 두 언어. 이는 브라우저 자체 zoom이나 실제 모바일 글자 설정의 대체 증거가 아니다.

## 재현 방법

저장소 루트에서 Node 24와 설치된 Chromium을 준비한다. 기본 설정으로 새 로컬 서버를 실행하거나 재사용하는 명령:

```bash
mise exec -- pnpm --filter docs exec playwright test \
  header-clarity.spec.ts header-font-preference.spec.ts \
  article-sticky-header.spec.ts mobile-drawer-resize.spec.ts \
  mobile-drawer-close.spec.ts skip-link.spec.ts \
  --workers=2 --global-timeout=300000
mise exec -- pnpm --filter docs typecheck
```

이번에는 이미 실행 중인 localhost 서버를 사용하기 위해 임시 config에서 기존 `playwright.config.ts`를 상속하고 `testDir`, `outputDir`를 절대 경로로 지정했다. `use.baseURL`은 localhost로, `webServer`는 `undefined`로 바꾸었다. 실제 최종 명령은 docs 앱 디렉터리에서 다음과 같다.

```bash
env PLAYWRIGHT_JSON_OUTPUT_FILE=/private/tmp/header-regression-final.json \
  mise exec -- pnpm exec playwright test \
  --config=/private/tmp/header-check.config.ts \
  header-clarity.spec.ts header-font-preference.spec.ts \
  article-sticky-header.spec.ts mobile-drawer-resize.spec.ts \
  mobile-drawer-close.spec.ts skip-link.spec.ts \
  --workers=2 --global-timeout=300000 --reporter=list,json
```

기본 글자 테스트는 임시 확장·프로필을 생성하고 종료 시 삭제한다. headless Chromium의 실제 창 크기 최소값 때문에 native 조건의 320px 측정을 주장하지 않는다.

## 결과와 증거

- 최초 헤더·검색·스크롤 검사: 19개 통과, 중복 프로젝트 8개 건너뛰기.
- 중단 뒤 계속된 추가 검사: 13개 통과, 22개 건너뛰기, 4개 시간 초과. tablet 본문 바로가기 두 언어, desktop 기본 글자 검사와 한국어 본문 바로가기가 시간 초과였다. 일부 실행 시간이 55분 이상으로 기록됐다. 시스템 중단/대기와 서버 요청의 영향을 분리할 증거는 없으므로 원인을 확정하지 않는다.
- 최종 전체 재실행: **33개 통과, 24개 의도적 건너뛰기, 실패 0개**. 건너뛰기는 desktop에서 한 번만 수행하는 폭 sweep/native 검사와 mobile 전용 메뉴 검사의 다른 프로젝트 실행분이다. 재시도 없이 통과했다.
- native 12개 조건 모두 헤더 링크·버튼 클릭 영역 겹침/가로 넘침 없음. 32px/500px는 두 줄, 기본 16px는 기존 65px 높이를 유지한다.
- 검색 열기·Escape 포커스 복귀, 메뉴 열기·닫기·화면 전환, 라이트/다크 및 reduced-motion, 본문 바로가기, 제목 anchor와 고정 헤더 스크롤 검사를 통과했다.
- TypeScript·수정 파일 ESLint 통과. 전체 앱 production 빌드는 이번 범위에서 실행하지 않았다.

[최종 실행 요약](../artifacts/2026-10-11-header-font-regression.json), [큰 기본 글자 수정 화면](../artifacts/2026-10-11-header-font32-fixed.png).

## 한계와 후속 작업

- 기본 글자 검사는 Chromium만 수행했다. Firefox/WebKit·설치 Chrome의 수동 설정·실기기·운영 배포는 미검증이다.
- 큰 글자에서는 헤더가 높아져 가용 본문 높이가 줄어든다. 작은 높이의 가로 화면 UX는 별도 확인한다.
- 주변 HTTP/TCP 초안·도식 변경이 있는 작업 트리에서 로컬 개발 서버를 사용했다. 해당 변경은 이 커밋에 포함하지 않는다.
- 시간 초과는 최종 실행에서 재현되지 않았다. 재발하면 환경 중단 여부와 해당 경로의 서버 응답 시간을 함께 수집한다.

## 관련 문서

- [반응형 정책](../../architecture/docs-responsive-policy.md)
- [헤더 보완 작업 기록](../../worklog/2026-10/2026-10-11-header-font-preference.md)
