# 글 중심 저널 UI 로컬 적용 검증

## 대상과 조건

- 날짜: 2026-10-31 KST.
- 기준: main `7b40457d7bceab051196a0fdd658a4b792b41340`에서 분리한 `codex/docs-ui-review-20261031`의 미커밋 작업 트리. 현재 결과를 해당 base 커밋에 이미 포함된 구현으로 표시하지 않는다.
- 도구: Node.js 24.22.1, pnpm 12.14.0, Next.js 16.4.3, Playwright Chromium.
- 개발 서버: loopback 3031. `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`, API 후보 환경 변수는 빈 값. NAS·운영 API·토큰을 사용하지 않는 로컬 published 문서 기준이다.
- 브라우저 회귀: 한·영, light/dark, 390×844 및 1280×800. 일부 테스트는 320/640/767/768/1024/1280px 전환을 포함한다. 별도 화면 관측은 1440×1000·390×844의 7개 URL, 14회 GET이다.
- 원시 캡처·테스트 산출물은 로컬 전용이다. 공개 Git·외부 첨부로 업로드하지 않았다.

## 재현 방법

Node 24·pnpm을 준비하고 저장소 루트에서 실행한다. 개발 서버는 새 작업 공간의 프로세스만 사용하며 다른 작업의 서버를 종료하지 않는다.

```sh
pnpm --filter docs... install --offline --frozen-lockfile --ignore-scripts
DOCS_E2E_PORT=3031 BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false \
  BLOG_CONTENT_API_BASE_URL= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= pnpm --filter docs dev:e2e
```

별도 터미널에서 다음을 실행했다. Playwright는 이미 실행 중인 loopback 개발 서버를 재사용했다.

```sh
pnpm --filter docs typecheck
pnpm --filter docs lint
pnpm --filter docs test:lib
DOCS_E2E_PORT=3031 pnpm --filter docs exec playwright test \
  e2e/feed-lead-story.spec.ts e2e/feed-recent-articles.spec.ts \
  e2e/uiux-compact-cards.spec.ts e2e/journal-design.spec.ts \
  --project=chromium-mobile --project=chromium-desktop --workers=1
DOCS_E2E_PORT=3031 pnpm --filter docs exec playwright test \
  e2e/page-skeletons.spec.ts e2e/header-clarity.spec.ts \
  e2e/docs-index-navigation.spec.ts e2e/docs-index-pagination.spec.ts \
  e2e/article-anchor-scroll.spec.ts e2e/journal-design.spec.ts \
  --project=chromium-mobile --project=chromium-desktop --workers=1
DOCS_E2E_PORT=3031 pnpm --filter docs exec playwright test \
  e2e/about-author.spec.ts e2e/hub-topic-filters.spec.ts \
  e2e/horizontal-overflow.spec.ts \
  --project=chromium-mobile --project=chromium-desktop --workers=1
```

## 결과와 증거

공개 가능한 집계·조건과 최초 CI 실패/후속 보완은 [정제 증거](../artifacts/2026-10-31-blog-journal-summary.json)에 연결한다. 실제 커밋·배포 완료 여부는 이 집계와 구분한다.

| 검사                     | 실제 결과                             | 해석                                                                                                                         |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 타입 검사                | 통과                                  | 앱 전체 `tsc --noEmit`                                                                                                       |
| 린트                     | 통과                                  | docs ESLint, warnings 0. 최종 수정 후 재검사도 수행                                                                          |
| 라이브러리 회귀          | 327개 통과                            | 검색·콘텐츠·주제·URL·렌더링 관련 기존 회귀와 신규 미리보기 검사 포함                                                         |
| 카드·저널 회귀           | 38개 통과, 4개 skip                   | title/여백/Enter 이동, 실제 이미지 유지·기본 이미지 생략, theme/locale, Backend 진입, 모바일 목차. skip은 프로젝트별 폭 조건 |
| 로딩·헤더·목록·목차 회귀 | 80개 통과, 6개 skip                   | 일부 저널 검사는 첫 묶음과 중복 재검증. 고유 118개 시나리오로 합산하지 않음                                                  |
| About·필터·넘침 회귀     | 34개 통과                             | 한·영/light·dark About, 주제 URL·reload/history, 320px 필터 및 7개 경로 가로 넘침                                            |
| 최종 검색 회귀           | 18개 통과                             | summary 우선 경로에서 본문 정제를 생략한 최종 수정 후 원격 검색 계약도 재확인                                                |
| 수동 화면 관측           | 14회 HTTP 200, 전체 가로 overflow 0px | Feed, React 검색, Web, UI/UX, Mobile, About, Event Loop 상세. 모든 상호작용의 정상 보장은 아님                               |

### 관측한 변화

- 기본 썸네일이 없을 때 빈 이미지 칸이나 대체 그림을 예약하지 않는다. 실제 UI/UX 글 이미지는 작은 크기로 유지되는 것을 육안 확인했다.
- Feed 최근 글 첫 카드 상단은 1440px 화면에서 434px, 390px 화면에서 562px였다. 이전 운영 표본은 각각 524px·730px였다. 운영/로컬 문서 구성과 네트워크·캐시가 같지 않아 통제된 A/B 또는 성능 향상으로 일반화하지 않는다.
- 로컬 Event Loop 본문 첫 문단 폭은 desktop 784px, mobile 334px였다. 운영 조사 desktop 표본은 944px였다.
- 모바일 제목 다음에 접힌 목차가 표시되고, Enter로 열기·절 선택·접힘·sticky header 아래 이동이 브라우저 회귀에서 통과했다. desktop 목차는 기존 왼쪽 표시를 유지한다.
- React 본문 검색 요약은 Markdown 구조를 제거한 텍스트에서 매치를 선택하고 HTML escape/highlight한다. 전체 MDX/Shiki를 목록마다 렌더하지 않는다. summary에서 결과를 만들 수 있으면 본문 정제를 생략한다.
- 스켈레톤과 실제 화면은 공용 폭/헤더/목록 규칙을 사용한다. 이번 geometry 회귀 통과는 실제 사용자 CLS=0 또는 모든 제목 길이에서 완벽한 높이 일치를 의미하지 않는다.

### 점검 중 발견한 검사 문제

처음 로컬 캡처 probe는 스트리밍 중 숨겨진 pending/ready 트리의 `h1` 두 개를 동시에 선택해 strict-mode 오류가 났다. 로딩 표시가 제거된 후 보이는 화면을 선택하도록 probe를 고쳐 14회 관측을 완료했다. 이를 앱의 중복 제목 표시 결함으로 등록하지 않았다. 원시 probe·JSON·스크린샷은 저장소 밖에 보관한다.

### 후속 메인 페이지 검증

같은 작업 트리에서 사용자의 `/ko` 메인 개선 요청을 이어서 적용했다. 소개를 짧게 바꾸고 최신 글을 주제 안내보다 앞에 배치했다. `LatestNoteRow`는 `DocumentPreviewCard`를 연결하는 어댑터로 줄였고 `OPEN` 표시를 제거했다. 주제 링크는 Web·Backend·UI/UX이며 Mobile URL이나 기존 주요 메뉴를 삭제한 것은 아니다.

```sh
DOCS_E2E_PORT=3031 pnpm --filter docs exec playwright test \
  e2e/root-landing-journal.spec.ts e2e/primary-action-contrast.spec.ts \
  e2e/page-skeletons.spec.ts --grep 'home|landing' \
  --project=chromium-mobile --project=chromium-tablet \
  --project=chromium-desktop --workers=1
```

- 결과: 22개 통과, 2개 skip. 폭 sweep을 desktop에서 한 번만 실행하는 조건이며 나머지 두 프로젝트에서 중복 실행하지 않았다.
- 확인: 한·영 UI/light·dark, 4개 실제 글의 Enter 이동, 주제 링크, 최초 화면 안 첫 글 노출, 320–1024px 폭 전환, CTA 대비·focus, 소개를 유지하는 부분 스켈레톤.
- 최초 CTA 목적지가 `/feed`에서 `/docs`로 바뀌어 해당 실제 href와 Enter 이동 기대값을 함께 갱신했다. Feed는 최근 글의 `더 보기`로 계속 연결한다.
- 별도 12회 관측: 320/390/1440px × 한·영 × light/dark, 모두 HTTP 200·가로 overflow 0px. 테마 클래스 적용 후 캡처했다.
- 첫 카드 상단: 390px 한국어 약 396px, 영어 461px. 1440px 두 언어는 434px였다. 콘텐츠·폰트에 따른 표본이며 성능 지표나 고정 디자인 계약은 아니다.
- 타입·린트 통과. 기술 원문은 번역·수정하지 않았으며 영어 UI에서 한국어 글 제목이 보이는 것은 원문 언어 유지다.
- 기록: [메인 작업 이력](../../worklog/2026-10/2026-10-31-blog-home-journal.md).

### Figma 편집 레이어 백업과 프로덕션 빌드

- 사용자 요청에 따라 hojeong-project 팀의 [Journal UI Backup](https://www.figma.com/design/TZNgMFGeYfNpVCtAgdnDMr)에 한국어 desktop 8개 화면을 백업했다. Home·Feed·Docs·Web·Mobile·UI/UX·About·Event Loop 상세이며, 실제 브라우저 viewport는 1512px이었다.
- 전체 화면을 한 장의 이미지로 붙인 백업이 아니다. 화면별 텍스트 노드는 각각 44·65·237·69·25·28·36·143개이며 아이콘은 벡터로 남아 있다. 이미지 fill은 Web의 160×112px 두 개, UI/UX의 136×88px 한 개처럼 실제 콘텐츠 썸네일에만 존재했다.
- CSS 폰트 이름 `pretendard`·`mono`를 Figma가 찾지 못한다. 사용자는 대체 폰트로 바꾸지 않고 원본 폰트를 설치한 뒤 편집하기로 선택했다. Pretendard·JetBrains Mono 설치 후 Figma의 missing-font 교체에서 이름을 연결해야 한다. 현재 글리프와 레이어는 보존됐지만 폰트 경고가 없는 완성된 디자인 시스템이나 즉시 수정 가능한 전체 컴포넌트 라이브러리로 표현하지 않는다.
- desktop 한국어 정적 화면의 백업이다. 모바일·다크 모드·영어·loading/interaction 상태 전체를 Figma에 백업한 것은 아니다. 해당 상태는 앞선 로컬 브라우저 회귀와 구분한다.
- 백업용 외부 스크립트는 개발 서버에서만 임시 삽입한 뒤 소스에서 제거했다. 최종 layout 파일에는 변경이 없고, 프로덕션 smoke에서도 해당 스크립트가 없음을 확인했다.

```sh
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  DOCS_ENABLE_REACT_INSPECTION=false pnpm --filter docs build
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false BLOG_CONTENT_API_BASE_URL= \
  BLOG_CONTENT_API_BASE_URL_PUBLIC= BLOG_CONTENT_API_BASE_URL_INTERNAL= \
  DOCS_ENABLE_REACT_INSPECTION=false pnpm --filter docs start \
  --port 3032 --hostname 127.0.0.1
```

- 최종 빌드: exit 0, 컴파일·TypeScript·33개 static page 생성 완료. 기존 published 글 두 개의 placeholder-like text 경고는 남았다. `node-brotli-runtime-security.mdx`·`tcp-socket-endpoints-lab.mdx`의 본문은 이번 UI 작업에서 수정하지 않았다.
- 프로덕션 모드 smoke: `/ko`, `/en`, `/ko/feed`, `/ko/docs`, `/ko/docs?q=react`, `/ko/web`, `/ko/mobile`, `/ko/ui-ux`, `/ko/about`, `/ko/docs/web/javascript-event-loop-runtime`을 390px·1440px에서 확인했다. 20회 모두 HTTP 200, 가로 overflow 0px, `pageerror` 0건, 백업 스크립트 0건이었다.
- Playwright 임시 probe·원시 결과 JSON은 저장소 밖에 보관했다. 최장 관측 완료 시간은 로컬 한정 415ms이며 운영 SLA나 성능 향상 측정으로 일반화하지 않는다.
- 이 기록 시점에는 공개 파일별 사용자 승인·커밋·푸시·PR·main 병합·Vercel 배포를 완료하지 않았다. 이후 원격 상태는 KAN-56에서 실제 커밋과 함께 기록한다.

## 한계와 후속 작업

- Production build와 loopback 프로덕션 smoke는 위 후속 단계에서 실행했다. Vercel 배포·실제 NAS 원격 콘텐츠를 연결한 브라우저 E2E는 아직 실행하지 않았다. 원격 검색 계약은 라이브러리 회귀에서 검사했다.
- 실제 Safari/Firefox·iOS/Android·스크린리더·가상 키보드·회전·실제 독자 과제 테스트는 남아 있다. 헤드리스 Chromium 통과를 접근성 인증이나 고객 만족도 결과로 표현하지 않는다.
- Markdown 요약 정리는 미리보기 전용의 제한된 정규화다. 복잡한 사용자 정의 MDX 컴포넌트를 완전한 문법 트리로 해석하는 렌더러가 아니다. 원문과 코드 복사 내용을 변경하지 않는다.
- 기존 메뉴·Mobile URL·하단 바는 유지했다. `모든 글`의 추가 진입은 제공하지만 전체 정보 구조 개편과 빈 주제 노출 정책은 별도 결정이다.
- 최초 로컬 검증 시점에는 구현 파일·정제 문서를 커밋·푸시·PR·공개 승인 manifest에 넣지 않았다. 이후 승인·PR·보완 경과는 아래에 구분한다. 원본 checkout의 미커밋 초안과 NAS 자동화 작업은 건드리지 않았다.

### 최초 PR CI와 리뷰 보완

- 사용자의 최종 70개 파일 공개 승인 후 공통 UI·메인·정제 기록의 3개 커밋을 푸시해 [PR #80](https://github.com/IMHOJEONG/web-tech/pull/80)을 생성했다. 첫 head `83b96bc`의 CI는 성공하지 않았다. 앞선 로컬 묶음 통과를 전체 CI 통과로 확대하지 않는다.
- Feed에서 기본 썸네일을 생략하므로 이미지의 이중 실패는 실제 썸네일이 있는 Web 카드에서 검사하도록 바꿨다. 실패 이미지 제거·요청 횟수·가로 넘침과 카드의 실제 상세 이동 검사는 유지했다. URL이 선반영될 수 있는 App Router 동작을 본문 완료와 분리해 오프라인 회귀 44개가 통과했다.
- `모든 글`이 있는 desktop/Drawer와 없는 하단 바의 목적지를 구분했다. `/docs`에서 하단 Feed에 잘못된 현재 페이지 표시를 하지 않으며 다른 경로의 기존 의미는 유지한다. 본문 바로가기 검사에는 새 모바일 목차의 native `summary`도 포함했다.
- 스켈레톤 측정은 살아 있는 React DOM에 `replaceWith`하지 않고, 같은 CSS·테마·폰트·viewport를 쓰는 JS 없는 독립 context에서 서버 pending markup을 렌더한다. live DOM을 React가 복구하면서 status 누락·detached 노드의 animation 오판·hydration 오류가 나던 측정 간섭을 제거했다. 최초 보완 묶음 87개가 통과했다.
- 영어 모바일 prefetch는 링크가 화면 아래에 있어 대기하던 30초 실패를 단독 재현했다. 관련 Link를 스크롤해 보이게 한 뒤 정상 prefetch를 기다리도록 바꿔 12개 조합이 통과했다. mock control cleanup은 3초로 제한한 독립 요청을 쓰고 최초 실패를 보존한다. fixture 자격 증명은 기존 공개 합성 값 그대로 순수 모듈로 공유하며 실제 운영 값·인증 정책·검사 예외를 도입하지 않았다.
- 검색 정규화 입력은 최대 32,768자 문맥으로 제한하고, raw code span/fence의 `<Button>` 같은 표기를 HTML 태그로 버리지 않도록 보존한 뒤 최종 출력에서 escape한다. 늦은 본문 매치·불가능한 날짜·서버/클라이언트 공통 TOC 필터를 포함한 라이브러리 331개가 통과했다.
- 모바일 목차에서 절을 선택하면 스크롤 후 해당 heading으로 focus를 이동하고 보이는 outline을 제공한다. 빈 TOC wrapper는 클라이언트와 같은 필터를 통과한 항목이 있을 때만 그린다.
- 최종 UI 보완 묶음은 39개 통과·3개 폭 조건 skip이었다. Backend 분류의 실제 결과, 목차 target focus·outline, 모든 셸 현재 위치, 본문 바로가기의 native summary 진입, 한·영/테마·헤더 폭 sweep을 포함한다.
- 영어 640px 헤더의 실제 nav 폭은 약 360px, 가용 가운데 영역은 약 374px였고 로고·컨트롤과 겹치지 않았다. 조건부 리뷰 가설만으로 breakpoint·폰트·줄 배치를 바꾸지 않았다.
- 공용 UI build와 동시에 시작한 첫 typecheck는 갱신 중인 dist를 찾지 못해 실패했다. build 종료 후 단독 재실행은 통과했다. 이는 소스 타입 오류를 무시한 성공 판정이 아니다. 최종 CI는 별도 head에서 다시 확인한다.
- 최종 소스에서 `pnpm --filter docs test:article:prod --reporter=list --output=/tmp/blog-journal-article-results`로 합성 콘텐츠 기반 production E2E 전체 162개를 실행해 모두 통과했다. 해당 명령은 전용 fixture 서버를 시작하고 앱을 다시 빌드한다. lint warnings 0과 단독 typecheck도 통과했으며 실제 NAS·Vercel 운영 결과와는 구분한다.

### 최종 리뷰의 추가 경계 조건

- `4320250`의 CI와 CodeRabbit check는 성공했지만 추가 미해결 스레드 5개가 생성되어 병합하지 않았다. check 성공과 리뷰 지적 해결을 구분한다.
- 긴 fence 안에서 시작하는 검색 미리보기의 JSX 손실, 앞쪽 HTML/Markdown 링크의 보이지 않는 목적지가 뒤쪽 본문 매치를 가리는 문제, 허용된 영문 날짜가 카드에서 사라지는 문제를 회귀 테스트로 재현했다. 수정 전 12개 중 3개 실패, 수정 후 12개 모두 통과했다.
- 검색은 각 32,768자 창을 정규화한 다음 보이는 텍스트에서 토큰을 찾고, 겹치는 창을 순차 탐색한다. fence 상태를 앞으로 전달해 코드 문맥을 유지한다. 전체 본문을 한 번에 HTML 정규화하거나 전체 소문자 복사하지 않는다. 여전히 검색 요약용이며 완전한 MDX 렌더러는 아니다.
- 날짜는 기존 ISO 달력 날짜 검사를 유지하면서 `October 31, 2026`, `2026-10`, `2026` 같은 기존 로컬 입력도 표시한다. ISO date-only의 UTC와 prose의 로컬 달력 부분을 구분했다. UTC·Asia/Seoul·America/Los_Angeles에서 동일 회귀를 통과했다.
- 이중 이미지 실패 테스트는 viewport 밖 카드도 eager로 요청하고, 모든 카드가 `unavailable`에 도달한 후에 기준 요청 수를 기록한다. 초기 preload·공유 backup 요청 수를 카드별 두 번으로 단정한 첫 보완은 실패해 제거했다. 원래의 기준 이후 추가 요청 없음·이미지 제거·넘침 없음·실제 상세 이동 검사는 유지한다.
- 정제 JSON에서 사용자 폰트 선택 설명만 제거하고 측정값은 보존했다. 폰트 결정과 설치할 항목은 위 Figma 문단에 그대로 둔다.
- 추가 수정의 라이브러리 전체 333개, 빌드·타입·lint가 통과했다. 기존 글 2개의 스타일 경고는 유지한다. 이미지 반복 검사 결과와 최종 공개 승인·원격 head·배포 결과는 KAN-56에 연결하며 운영 완료를 선기록하지 않는다.

## 원본 artifact 상대 링크

- [정제 집계](../artifacts/2026-10-31-blog-journal-summary.json). raw 캡처·trace·전체 로그는 비공개 로컬 자료로 유지한다.

## 관련 문서

- [설계와 적용 범위](../../architecture/docs-blog-redesign-proposal.md)
- [당초 운영 화면 조사](2026-10-31-blog-ui-review.md)
- [작업 기록](../../worklog/2026-10/2026-10-31-blog-journal-implementation.md)
