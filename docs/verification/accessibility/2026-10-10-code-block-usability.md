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

## 한계와 후속 작업

- 루트 글자 크기 200% 검사는 실제 브라우저 zoom 200%와 다르다. 실제 확대·OS 글자 크기 설정도 확인해야 한다.
- WebKit은 실제 Safari/iPhone 검증이 아니다. 실제 기기·VoiceOver 등 스크린리더는 미검증이다.
- clipboard는 mock했다. 문자열과 실패 안내를 검사했으며 OS 클립보드 권한은 검증하지 않았다.
- Shiki fixture는 출력 모양을 재사용하며 하이라이터 엔진 자체를 실행하지 않는다. NAS의 모든 원격 코드도 검사하지 않았다.
- 전체 앱 빌드·CI·운영 배포는 이번 점검 범위에 포함하지 않았다.
- 두 UI 문제는 작업 트리에서 수정하고 자동 검사를 통과했다. 실제 브라우저 zoom·축소, 실기기, 구형 브라우저, 배포는 별도 확인이 필요하다. 검사 범위는 [축소·확대 절차](../../runbooks/docs-responsive-browser-device-checklist.md#축소확대-점검-범위)에 유지한다.

## 관련 문서

- [본문 출력 계약](../../architecture/docs-article-rendering-convergence.md#code-block)
- [브라우저·기기 점검](../../runbooks/docs-responsive-browser-device-checklist.md)
- [작업 기록](../../worklog/2026-10/2026-10-10-code-block-ui-check.md)
