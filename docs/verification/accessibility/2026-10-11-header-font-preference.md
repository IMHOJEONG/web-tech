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

### 배포 후 확인 (2026-10-11 23시 KST)

- `d8c09527f8cb9195aa16258fee9b2bec916ee818`을 `origin/feature/docs`에 푸시했다. [Vercel 배포](https://vercel.com/hojeong-ims-projects/web-tech/2TABKhgmP9ZT527hqSSFNH8eHsXV) 완료 및 운영 HTML의 새 HeaderFrame/container 규칙을 확인했다.
- [CI 38146174659](https://github.com/IMHOJEONG/web-tech/actions/runs/38146174659)의 6개 job 성공. 반응형 271개 통과/50개 건너뛰기, 격리 production article 108개 통과. [Documentation CI](https://github.com/IMHOJEONG/web-tech/actions/runs/38146174689)도 성공했다. CI의 production article은 로컬 격리 production 서버이지 운영 주소 검사가 아니다.
- 운영 `https://heap-forge.app`에서 native 기본 글자 16/32px·500/640/1280px·두 언어 12개 조건 모두 클릭 영역 겹침·가로 넘침 없음. root CSS 확대 320/390/500px의 한국어 테스트도 통과했다. 영어는 첫 실행에서 load 시간 초과 후, 탐색 예산을 60초로 지정한 별도 실행에서 4초 만에 통과했다. 합친 결과를 한 번의 전체 실행 성공으로 표현하지 않는다.
- 최초 운영 전체 sweep은 11개 통과, 10개 시간 초과, 16개 건너뛰기, 20개 미실행으로 5분 global timeout에 도달했다. 실패는 주로 `page.goto`의 `load` 대기였으며 헤더 geometry 판정에 도달하지 못했다. 운영 전체 탐색이 통과했다고 주장할 수 없다.
- 별도 관측에서 DOM은 HTTP 200으로 약 4.8초에 도착했으나 약 35초 후에도 폰트 1개와 같은 출처 JS 4개 요청이 pending이었다. 헤더 활성화를 기다리는 검사도 시간 초과했다. JS 한 파일은 curl에서 200·836,205 bytes·전송 11.29초였다. HTTP 오류나 pageerror는 해당 관측에서 없었다. CDN·로컬 네트워크·브라우저별 원인을 분리하지 못했으므로 앱 코드 원인 또는 장애 없음으로 단정하지 않는다.
- CI의 `destination stream closed early` 로그 8건은 article 테스트 통과와 별개로 남아 있다. 취소/장애 분류는 기존 요청 생명주기 정책의 후속 과제이며 이번 헤더 수정의 성공 근거로 사용하지 않는다.

[배포·CI·실패/재검증 증거](../artifacts/2026-10-11-header-deployed-check.json).

운영 검사는 임시 config에서 `use.baseURL`만 운영 주소로 지정하고 로컬 `webServer`를 제거했다. 새 배포를 생성하거나 원격 콘텐츠를 수정하지 않는 읽기 전용 검사다. 실제 핵심 재검증 명령:

```bash
env PLAYWRIGHT_JSON_OUTPUT_FILE=/private/tmp/header-deployed-native.json \
  mise exec -- pnpm exec playwright test \
  --config=/private/tmp/header-deployed.config.ts \
  header-font-preference.spec.ts --project=chromium-desktop \
  --workers=1 --global-timeout=180000 --reporter=list,json
env PLAYWRIGHT_JSON_OUTPUT_FILE=/private/tmp/header-deployed-en-recheck.json \
  mise exec -- pnpm exec playwright test \
  --config=/private/tmp/header-deployed.config.ts \
  header-font-preference.spec.ts --project=chromium-desktop \
  --grep 'en: enlarged root font' --workers=1 \
  --timeout=60000 --global-timeout=90000 --reporter=list,json
```

## 한계와 후속 작업

- 기본 글자 검사는 Chromium만 수행했다. Firefox/WebKit·설치 Chrome의 수동 설정·실기기는 미검증이다. 운영 배포에서는 헤더 핵심 조건만 통과했으며 전체 탐색 검사는 로드 지연이 남았다.
- 큰 글자에서는 헤더가 높아져 가용 본문 높이가 줄어든다. 작은 높이의 가로 화면 UX는 별도 확인한다.
- 주변 HTTP/TCP 초안·도식 변경이 있는 작업 트리에서 로컬 개발 서버를 사용했다. 해당 변경은 이 커밋에 포함하지 않는다.
- 시간 초과는 최종 실행에서 재현되지 않았다. 재발하면 환경 중단 여부와 해당 경로의 서버 응답 시간을 함께 수집한다.

## 관련 문서

- [반응형 정책](../../architecture/docs-responsive-policy.md)
- [헤더 보완 작업 기록](../../worklog/2026-10/2026-10-11-header-font-preference.md)
