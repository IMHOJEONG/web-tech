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
- 구현 파일·정제 문서는 아직 커밋·푸시·PR·공개 승인 manifest에 넣지 않았다. 원본 checkout의 미커밋 초안과 NAS 자동화 작업은 건드리지 않았다.

## 관련 문서

- [설계와 적용 범위](../../architecture/docs-blog-redesign-proposal.md)
- [당초 운영 화면 조사](2026-10-31-blog-ui-review.md)
- [작업 기록](../../worklog/2026-10/2026-10-31-blog-journal-implementation.md)
