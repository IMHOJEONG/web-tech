# 배포된 블로그 접근성 점검

## 대상과 조건

- 검증일: 2026-09-23 KST.
- 공개 사이트: `https://heap-forge.app`.
- 비교 코드: `4f5b0bbe38b0d78d55e358d5443bfe2fa2e4220c`.
- GitHub 배포 기록 `6591957269`: 위 커밋의 `Production – web-tech` 성공 상태. 공개 도메인의 모든 산출물이 해당 커밋과 같다는 증거로 해석하지 않는다.
- Node 24, Playwright, Chromium의 390×844·1280×800 화면에서 기존 E2E를 실행했다. 서버 시작·재배포·webhook 호출은 하지 않았다.
- Firefox·WebKit은 390px·1280px, 한국어·영어 검색 결과 화면을 별도로 검사했다. 실제 기기나 스크린 리더 음성 검사는 아니다.

## 재현 방법

기존 `apps/docs/playwright.config.ts`를 기준으로 임시 설정에서 `webServer`를 제거하고 `use.baseURL`을 `https://heap-forge.app`으로 바꾼다. 프로젝트는 `chromium-mobile`, `chromium-desktop`만 사용하고 worker 1, retry 0, expect timeout 10초로 제한한다. 운영 환경에는 읽기·검색·메뉴 조작만 수행한다.

대상 파일:

- `e2e/skip-link.spec.ts`
- `e2e/shell-focus-contrast.spec.ts`
- `e2e/keyboard-accessibility.spec.ts`
- `e2e/mobile-drawer-resize.spec.ts`

이번에 실행한 명령은 저장소 루트 기준이다. `/tmp` 설정은 이번 실행용 파일이며 저장소에 포함하지 않았다. 원본 결과 JSON에 사용 설정과 테스트 목록이 있다.

```sh
mise exec -- pnpm --filter docs exec playwright test \
  --config=/tmp/docs-accessibility-production.config.cjs
```

브라우저에서 `/ko/web`을 열고 첫 Tab 후 다음 값을 읽으면 CSS 누락을 재확인할 수 있다.

```js
const link = document.querySelector('a[href="#main-content"]');
getComputedStyle(link).outlineStyle;
getComputedStyle(link).outlineWidth;
getComputedStyle(document.body).getPropertyValue("--docs-interactive-text");
```

## 결과와 증거

| 검사                              | 결과                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Chromium 기존 E2E 24개            | 16 통과, 4 실패, 4 조건부 제외                                                             |
| 본문 바로가기                     | ko/en 각각 15개 경로, 두 화면 크기에서 통과                                                |
| 검색 Escape와 포커스 복귀         | ko/en, 두 화면 크기에서 통과                                                               |
| 로컬 상세 main·h1 구조            | ko/en, 두 화면 크기에서 통과                                                               |
| 모바일 메뉴 회전 후 오버레이 제거 | 라이트·다크 × 모션 설정 4개 통과; 데스크톱 4개는 제외                                      |
| 포커스·대비 테스트                | 네 조합 모두 첫 본문 바로가기의 outline 검사에서 실패; 이후 대비 assertion은 실행되지 않음 |
| Firefox·WebKit                    | 검색 결과에서 언어, 본문 포커스, 다음 컨트롤 이동, 검색 닫기·복원 8개 조합 통과            |

원본: [Chromium 결과](../artifacts/2026-09-23-deployed-shell-playwright.json), [Firefox·WebKit 결과](../artifacts/2026-09-23-deployed-shell-cross-browser.json).

실패의 직접 증거:

- 기대: 본문 바로가기 `outline-style: solid`, `outline-width: 2px`.
- 관측: `outline-style: auto`, `outline-width: 1px`. `:focus-visible` 자체는 참이었다.
- `--docs-interactive-text`의 body 계산값은 빈 문자열이었다.
- 실제 로드된 `/_next/static/immutable/chunks/29huln1ga3m8n.css`에는 새 토큰 정의와 실선 포커스 규칙이 없었다. `html,body` 규칙에도 토큰 정의가 없었다.
- 같은 CSS URL에 확인용 쿼리를 붙여 Cloudflare `MISS` 응답을 받아도 두 규칙은 없었다. Cloudflare HIT만으로 원인을 단정할 수 없다.
- 로컬 소스를 PostCSS/Tailwind로 각각 `optimize: false`, `optimize: true` 처리했을 때 두 규칙은 모두 유지됐고 warning은 없었다. Next.js 전체 production 빌드와 동일한 검증은 아니다.

## 한계와 후속 작업

### 로컬 production 후속 검증

같은 날 동일 커밋의 앱 코드로 `next build`와 `next start`를 실행했다. Node `24.12.0`, Next.js `16.3.4`이며 기존 `.next` 캐시는 삭제하지 않았다. 따라서 캐시를 비운 빌드 실험은 아니다. 원격 콘텐츠·로그 전송·개발 검사 도구를 끄고, 로컬 문서만 사용했다. 저장소 루트에서 실행한 명령:

```sh
env BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false \
  BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_TOKEN= \
  DOCS_BETTER_STACK_SOURCE_TOKEN= DOCS_BETTER_STACK_INGESTING_URL= \
  DOCS_ENABLE_REACT_INSPECTION=false \
  mise exec -- pnpm --filter docs build
```

동일한 환경 변수 설정에서 `mise exec -- pnpm --filter docs exec next start --hostname 127.0.0.1 --port 3116`으로 실행했다. 운영 검사와 동일한 테스트·프로젝트 설정의 `baseURL`만 `http://127.0.0.1:3116`으로 바꿔 다음 명령으로 검사했다.

```sh
mise exec -- pnpm --filter docs exec playwright test \
  --config=/tmp/docs-accessibility-local-production.config.cjs
```

- 빌드 성공: 콘텐츠 16개 검증, TypeScript, 정적 페이지 28개 생성 통과.
- Chromium 20개 통과, 4개 조건부 제외. 운영에서 실패했던 라이트·다크 × 모바일·데스크톱의 4개 포커스·대비 검사도 통과했다.
- `.next/static/chunks/2saq5vmtcukt3.css`에 새 토큰 정의와 포커스 규칙이 포함됐다.
- 브라우저 계산값: 라이트 `#b74400` / `rgb(23, 23, 23) solid 2px`, 다크 `#fb923c` / `rgb(237, 237, 237) solid 2px`.
- 모바일 두 테마의 캡처도 확인했다. 검사 후 임시 production 서버는 종료한다.
- 테스트 중 서버 로그에 `The destination stream closed early`도 관측됐다. 테스트 페이지 전환·종료와의 인과관계는 별도 검증하지 않았으며, 전체 런타임에 오류가 없다는 결론은 내리지 않는다.

원본: [로컬 production 테스트](../artifacts/2026-09-23-local-production-shell-playwright.json), [CSS 해시·계산값](../artifacts/2026-09-23-local-production-shell-css.json).

**동일 코드의 로컬 production 빌드에서는 CSS 누락이 재현되지 않았다.** 원격 콘텐츠와 배포 환경은 다르므로 Vercel 캐시 문제라고 확정할 수는 없다. 다음 단계는 Vercel 캐시 미사용 재배포 후 원본 산출물과 공개 CSS를 비교하는 것이다.

CSS 누락은 확인했지만 빌드 캐시, 배포 산출물, 상위 캐시 중 어느 단계에서 발생했는지는 확정하지 않았다. 최신 배포의 직접 URL은 `302`로 Vercel SSO에 연결되어 CSS 응답을 확보하지 못했다. 인증을 우회하지 않았으며 공개 도메인과 원본의 직접 비교는 완료하지 못했다.

다음 작업은 동일 커밋의 캐시 미사용 빌드 산출물과 공개 CSS를 비교하는 것이다. 배포 변경은 별도 승인 후 진행한다. 코드에 `!important`를 추가하거나 대비 테스트를 완화해 우회하지 않는다.

실제 VoiceOver·NVDA 낭독, 초기 로딩 중 본문으로 이동한 뒤 콘텐츠가 교체될 때의 포커스 연속성, 확대·뒤로 가기 조합은 미검증이다. 이번 결과는 전체 WCAG 적합성을 의미하지 않는다.

## 관련 문서

- [본문 바로가기 구현 기록](../../worklog/2026-09/2026-09-22-skip-link-focus-landmarks.md)
- [키보드·스크린 리더 검사 절차](../../runbooks/docs-responsive-browser-device-checklist.md#키보드와-스크린-리더-검사-순서)
