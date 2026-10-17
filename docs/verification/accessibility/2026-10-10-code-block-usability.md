# 코드 접기 UI/UX 점검

## 대상과 조건

- 검증일: 2026-10-10, Asia/Seoul.
- 수정 전 대상: `feature/docs`의 `ec1e210` 코드 접기·컴팩트 조작 영역.
- 수정 후 대상: 같은 HEAD 위 미커밋 작업 트리. 푸시·배포는 하지 않았다.
- 환경: macOS, Node.js 24.12.0, Playwright 1.62.1, Chromium·Firefox·WebKit headless.
- 격리 fixture: 3개 엔진 × 폭 320/390/1280px × 한국어/영어 × 라이트/다크 × 루트 글자 크기 100/200% × 로컬/Shiki 모양/원격, 총 216개 코드 프레임 조건.
- 실제 개발 페이지: Chromium에서 폭·언어·테마 조합 12개. 현재 작업 트리의 공개 backpressure 글을 사용했다.

수정 전 격리 검사는 커밋된 CSS를 사용했다. 수정 후 스크립트는 작업 트리의 CSS와 컴포넌트를 함께 사용하고 CSS SHA-256을 기록한다. 실제 페이지에는 다른 작업의 미커밋 변경이 포함되므로 커밋만의 배포 증거로 해석하지 않는다.

## 재현 방법

저장소에 설치된 Playwright 브라우저가 필요하다. 저장소 루트에서 기존 회귀 검사를 실행한다.

```sh
mise exec -- pnpm --filter docs test:code-block
mise exec -- pnpm --filter docs typecheck
```

별도 터미널에서 개발 서버를 실행한 뒤, `apps/docs` 디렉터리에서 점검 스크립트를 실행한다.

```sh
mise exec -- pnpm --filter docs dev
```

```sh
mise exec -- node --experimental-strip-types scripts/check-code-block-usability.ts http://localhost:3001
```

URL 인자를 생략하면 격리 fixture만 검사한다. 스크립트는 localhost/127.0.0.1만 허용하며, 수정 후 JSON과 캡처를 별도 파일에 생성해 기존 증거를 덮어쓰지 않는다. 수정 전 도구는 관측값만 집계했지만, 수정 후 도구는 브라우저 실행 누락·겹침·잘림·가로 넘침·미번역·기능 실패를 종료 코드 1로 처리한다. 종료 코드 0도 사이트 전체의 접근성 준수를 뜻하지는 않는다.

## 결과와 증거

### 수정 전 P2: 영문 복사 문구 미번역

영어 조건 108개 모두 복사 버튼 접근성 이름이 `코드 복사`였다. 로컬 버튼과 원격 enhancer의 표시·성공·실패 안내도 한국어로 고정되어 있다. 접기 안내는 영어로 바뀌지만 복사 안내는 바뀌지 않는 기존 불일치다.

수정: 로컬 버튼과 원격 enhancer가 `getCodeCopyLabels`를 공유하고 `useLocale`로 언어를 선택한다. 기존 E2E의 한국어 고정 기대값을 제거하고, 영어 기본·성공·실패·자동 복구의 표시와 접근성 이름을 검사한다.

### 수정 전 P2: 확대된 하단 안내와 언어 태그 겹침

Chromium·WebKit의 폭 320px, 영어, 루트 글자 크기 200%에서 라이트/다크 및 모든 코드 소스가 겹쳐 총 12개 조건이 실패했다. `Show full code`와 줄 수가 두 줄로 바뀌면서 절대 위치의 언어 태그와 충돌한다. 안내가 카드 밖으로 잘리는 문제는 없지만 내부 정보가 겹친다. Firefox와 일반 글자 크기, 390/1280px에서는 재현되지 않았다.

수정: 하단 안내·줄 수·언어 태그를 같은 summary의 grid/flex 흐름에 배치하고 높이를 내용에 맞췄다. 줄 수의 nowrap도 제거했다. 첫 수정 시 count가 grid 열 바깥으로 넘쳐 남은 겹침을 캡처로 확인했으며, 컨테이너뿐 아니라 실제 줄 수 영역까지 검사하도록 보완했다.

`::details-content`가 지원되면 펼친 코드 아래에 summary를 배치한다. 지원하지 않으면 펼친 코드 위에 정상 흐름의 summary가 남으며 기능은 유지한다. [MDN 호환성 설명](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::details-content)을 참고했으며 실제 구형 브라우저는 미검증이다.

[겹침 캡처](../artifacts/2026-10-10-code-footer-200-percent.png)와 [전체 측정값](../artifacts/2026-10-10-code-block-usability.json)에 근거를 보관했다.

### 수정 전 기능 검사

| 항목               | 관측 결과                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------- |
| 기존 코드 접기 E2E | 10개 통과: 짧은 코드, 접기, 키보드/포인터, 전체 복사·실패 안내, 무-JavaScript, reduced-motion |
| 격리된 216개 조건  | Enter 펼치기·Space 접기·전체 문자열 복사·reduced-motion 모두 통과, pageerror 없음             |
| 페이지 가로 넘침   | 격리 216개 및 개발 페이지 12개에서 없음. 긴 코드는 코드 영역 내부에서 스크롤                  |
| 개발 페이지 12개   | HTTP 200, 펼치기·접기·전체 복사 통과, pageerror 없음                                          |
| UI 표현            | 위 두 P2 문제는 미조치. 기능 통과와 별개로 남겨 둠                                            |

개발 페이지는 `/ko/docs/category/be/node-js/stream-backpressure-diagnosis`와 대응하는 `/en/` 경로다. 원격 전체 복사 기대값에는 기존 sanitizer의 외부 공백 제거를 반영했으며, 미리보기만 복사되지 않는지 전체 문자열을 비교했다.

### 수정 후 재검증

글자 크기에 125·150%를 추가하여 3개 엔진의 총 432개 조건을 재검사했다. 기존 수정 전 JSON·캡처는 그대로 보관했다.

- 432개 조건: 겹침·잘림·페이지 가로 넘침·영문 한국어 복사 이름 0건. 전체 복사·키보드 접기·reduced-motion과 개발 페이지 12개 기능 검사 통과.
- 코드 접기 E2E 16개: 다국어 복사 상태·실패 후 복구 및 320px/125·150·200%의 접힌/펼친 footer 포함.
- 공통 규칙 단위 검사 6개: 줄 수·미리보기·전체 코드·복사 문구·언어 라벨 escaping 통과.
- docs 타입 검사, 이번 수정 파일 ESLint 통과.

[수정 후 측정값](../artifacts/2026-10-10-code-block-usability-fixed.json), [수정 후 200% 캡처](../artifacts/2026-10-10-code-footer-200-percent-fixed.png).

## 2026-10-11 배포 후속 확인

초회 작업 트리 검증과 별도로 `9c84c9d`의 CI 성공과 Vercel 배포 완료를 확인하고 공개 페이지를 검사했다. GitHub의 배포 상태는 같은 SHA에 연결되어 있지만 공개 페이지가 반환한 SHA를 별도로 대조하지는 않았다.

- 대상: `https://heap-forge.app/{ko,en}/docs/category/be/node-js/stream-backpressure-diagnosis`.
- 환경: macOS, Node.js 24.12.0, Playwright 1.62.1, Chromium headless.
- 표본: 언어 2개 × 폭 320/390/1280px × 라이트/다크 × 루트 글자 크기 100/200%, 총 24개 조건. 축소·실제 browser zoom은 포함하지 않았다.
- 임시 검사 실행 명령: 저장소 루트에서 `mise exec -- node /private/tmp/check-deployed-code-blocks.mjs`. 이 스크립트는 이번 실행용이며 저장소의 상시 회귀 검사에 편입하지 않았다.
- 수동 재현: 대상 글에서 긴 코드 블록의 Enter 펼치기·Space 접기·포인터 토글, 접힌 상태의 전체 복사와 복사 상태 복구를 확인한다. DevTools로 root `font-size`를 32px로 바꾸는 조건은 실제 페이지 확대와 구분한다.

24개 조건 모두 HTTP 200, 키보드·포인터 접기/펼치기, 전체 코드 클립보드 복사와 idle 상태 복구가 통과했다. 이번 복사는 mock이 아닌 Chromium 클립보드에 쓴 문자열을 읽어 전체 본문과 비교했다. 코드 footer의 겹침·잘림, 페이지 가로 넘침, pageerror·console warning/error·400 이상 리소스 응답은 관측되지 않았다. 복사 버튼과 summary의 높이는 44px 이상이었다. [배포 측정값](../artifacts/2026-10-11-deployed-code-blocks.json)에 원본 결과를 보관했다.

### 별도 발견: 글자 확대 시 모바일 헤더 겹침

영어·폭 320px·root `font-size: 32px`의 전체 화면에서 로고와 검색 버튼이 겹친다. 로고의 x 범위는 약 99.42~229.38px, 검색 버튼은 104~192px이며 y 범위도 겹친다. 두 영역은 서로 다른 flex 묶음이고 확대된 내부 요소의 최소 너비를 좁은 헤더가 수용하지 못하는 상황이다. 코드 프레임 검사 성공을 헤더 또는 전체 사이트 접근성 성공으로 해석하지 않는다. [전체 화면 캡처](../artifacts/2026-10-11-enlarged-mobile-header.png)를 남겼으며 애플리케이션 수정은 하지 않았다.

후속으로 같은 배포 글의 헤더를 한국어·영어, 기본 root 16px에서 폭 320/390/640/768/1280px로 검사했다. 기본 크기 10개 조건에서는 로고·검색 버튼 겹침과 페이지 가로 넘침이 없었다. 폭 320/390px의 root 32px 조건을 추가한 4개 조건에서는 두 언어 모두 겹침을 재현했다. 모든 14개 요청은 HTTP 200이었다. 기본 모바일 화면에서 항상 발생하는 문제라는 의미는 아니다.

실행 명령은 `mise exec -- node /private/tmp/check-live-header-baseline.mjs`와 `mise exec -- node /private/tmp/capture-live-header-comparison.mjs`였다. 두 파일은 일회성 임시 검사다. [비교 측정값](../artifacts/2026-10-11-deployed-header-baseline.json), [320px 기본 헤더](../artifacts/2026-10-11-header-font100.png), [같은 폭의 글자 200% 헤더](../artifacts/2026-10-11-header-font200.png)를 보관했다. 후속 검사도 Chromium headless이고 실제 browser zoom은 아니다.

실제 Chrome 154.0.8037.99의 검증용 창을 여는 대체 경로도 시도했다. Apple Events JavaScript는 꺼져 있어 화면 내부 값을 읽지 못했고 macOS `screencapture`도 display/rect 이미지를 만들지 못했다. 브라우저 보안 설정이나 화면 기록 권한을 변경하지 않았다. 메뉴 조작 시도만으로 실제 확대 상태와 배치를 검증했다고 판정하지 않는다.

### CI와 배포 결과 구분

[CI 38051951925](https://github.com/IMHOJEONG/web-tech/actions/runs/38051951925)의 6개 작업은 모두 성공했다. 반응형 268개, production article 108개, 공용 UI 64개와 consumer 16개가 통과했다. [Vercel 배포](https://vercel.com/hojeong-ims-projects/web-tech/FkaHAzikL2gLisMfiWBKNavLBNVi)는 완료 상태다.

게시 갱신 브라우저 테스트 구간에 `The destination stream closed early`가 8회 남았다. 요청 ID가 있는 hook-only 로그도 있지만 응답 완료·연결 종료·선행 오류를 함께 대조한 증거는 부족하다. 시간상 같은 구간이라는 이유나 테스트 통과만으로 정상 취소를 확정하지 않는다. 이 서버 로그와 이번 배포 브라우저의 pageerror 0건은 서로 다른 측정 범위다.

초회 실제 브라우저 제어 도구는 초기화 오류로 실행되지 않았다. 설치 Chrome 메뉴 조작·OS 글자 확대·실기기·스크린리더는 미검증이다. 이후 격리 Chromium의 브라우저 자체 확대와 기본 글자 설정은 아래 후속 검증으로 구분했다. 배포 표본은 로컬 문서 한 글이며 NAS 원격 문서 전체나 운영 Runtime Logs까지 확인한 것은 아니다.

### 후속: 브라우저 자체 확대와 기본 글자 설정 대조

사용자 Chrome의 프로필·보안 설정을 바꾸지 않고 임시 프로필의 Chromium 151.0.7922.34에서 검사했다. Playwright 1.62.1의 `chromium` channel, headless, `viewport: null`, 1280px 창을 사용했다. [Playwright 확장 검사 방식](https://playwright.dev/docs/chrome-extensions)에 따라 격리 프로필에만 검증용 확장을 로드했다.

[공식 tabs 확대 API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom)로 `automatic`·`per-tab` 확대를 설정하고 `getZoom` 결과를 대조했다. CSS zoom·root 글자 변경·device metrics override·pinch 확대는 사용하지 않았다. root 글자는 계속 16px, visual viewport scale은 1이며 페이지 zoom에 따라 devicePixelRatio와 CSS 표시 폭이 바뀌었다.

| 브라우저 배율 | CSS 표시 폭 |
| ------------- | ----------- |
| 80%           | 1600px      |
| 90%           | 1422px      |
| 100%          | 1280px      |
| 125%          | 1024px      |
| 150%          | 853px       |
| 200%          | 640px       |
| 400%          | 320px       |

한국어·영어 × 라이트/다크 × 7개 배율, 28개 조건 모두 HTTP 200, 로고·검색 버튼 영역 비겹침, 페이지 가로 넘침 없음, footer 비겹침·비잘림, 키보드 접기·펼치기와 전체 문자열 클립보드 복사가 통과했다. pageerror는 없었다. 실행 명령은 `mise exec -- node /private/tmp/check-native-browser-zoom.mjs`였으며 [측정값](../artifacts/2026-10-11-native-browser-zoom.json)을 보관했다.

큰 배율의 locator 단위 캡처가 빈 영역을 반환해 해당 이미지는 증거에서 제외했다. 전체 표시 영역을 `Page.captureScreenshot`으로 다시 수집하고 눈으로 확인한 [400% 화면](../artifacts/2026-10-11-native-zoom400.png)을 남겼다. 재캡처 명령은 `mise exec -- node /private/tmp/capture-native-zoom-viewport.mjs`였다. 이 환경의 400% 표시 영역 높이는 203 CSS px이며 상·하단 고정 탐색 영역이 읽기 공간을 많이 차지한다. 기능 통과를 화면 사용성이 최적이라는 의미로 해석하지 않는다.

기본 글자 설정은 별도 임시 프로필에서 [fontSettings API](https://developer.chrome.com/docs/extensions/reference/api/fontSettings#method-setDefaultFontSize)로 16/32px를 비교했다. 페이지 zoom은 100%, root inline 글자 스타일은 비어 있었다. 처음 320/390px 창을 요청했지만 실제 창은 최소 500px로 열려 해당 실행을 폭 320/390 검증으로 쓰지 않았다. 실제 폭과 요청 폭이 일치하는 500/640px에서 두 언어를 다시 검사했다.

8개 조건 중 500px·기본 글자 32px의 두 언어에서 로고 링크와 검색 버튼의 클릭 영역이 겹쳤다. 로고 영역의 오른쪽은 약 300.69px, 검색 버튼의 왼쪽은 284px로 약 16.69px 겹친다. 캡처에서 로고는 두 줄로 표시되지만 글자 자체가 검색 아이콘에 가려진 것은 아니므로 **링크·버튼 영역 충돌**로 구분한다. 나머지 6개 조건은 겹치지 않았으며 가로 넘침은 없었다. [기본 글자 설정 측정값](../artifacts/2026-10-11-native-font-preference.json)과 [500px·32px 헤더](../artifacts/2026-10-11-native-font32-header.png)를 보관했다. 실행 명령은 `mise exec -- node /private/tmp/check-native-font-preference.mjs`였으며 종료 시 확장의 글자 설정을 해제했다.

스크립트·확장은 이번 검사용 `/private/tmp` 파일이며 상시 회귀 검사에 편입하지 않았다. 사용자 설치 Chrome 154의 메뉴·실기기를 직접 검사한 것은 아니지만, 격리 Chromium의 브라우저 zoom과 기본 글자 설정은 실제 API와 계산값으로 대조했다. 일반 페이지 확대에서는 앞선 root-font 스트레스 캡처와 같은 겹침이 없었고, 큰 기본 글자 설정의 좁은 헤더는 별도 보완 대상으로 유지한다.

## 한계와 후속 작업

- 루트 글자 크기 200%와 브라우저 zoom 200%는 다르다. 후속 Chromium 자동 검사는 두 설정을 분리했고, 설치 Chrome 메뉴와 OS 글자 크기 설정은 미검증이다.
- WebKit은 실제 Safari/iPhone 검증이 아니다. 실제 기기·VoiceOver 등 스크린리더는 미검증이다.
- 초회 fixture의 clipboard는 mock했다. 배포 후속 검사는 권한을 허용한 Chromium 클립보드로 전체 문자열을 확인했지만 사용자의 실제 브라우저·OS 권한 및 거부 동작은 미검증이다.
- Shiki fixture는 출력 모양을 재사용하며 하이라이터 엔진 자체를 실행하지 않는다. NAS의 모든 원격 코드도 검사하지 않았다.
- 초회에는 전체 앱 빌드·CI·운영 배포를 확인하지 않았다. 이후의 CI·배포 표본 검사 결과는 위 10-11 절에 구분했다.
- 두 코드 UI 문제의 배포 표본과 격리 Chromium의 zoom·축소 검사는 통과했다. 설치 브라우저 메뉴 조작, 실기기, 구형 브라우저와 큰 기본 글자 설정의 헤더 보완은 별도 확인이 필요하다. 검사 범위는 [축소·확대 절차](../../runbooks/docs-responsive-browser-device-checklist.md#축소확대-점검-범위)에 유지한다.

## 관련 문서

- [본문 출력 계약](../../architecture/docs-article-rendering-convergence.md#code-block)
- [브라우저·기기 점검](../../runbooks/docs-responsive-browser-device-checklist.md)
- [작업 기록](../../worklog/2026-10/2026-10-10-code-block-ui-check.md)
