# Worklog: 2026-04-29

## Summary

- Figma 로컬 MCP로 `Main Feed` 본문 구조 확인
- `apps/docs/widgets/main-feed/ui/main-feed.tsx` 구현
- `/docs` 기본 페이지에 `MainFeed` 연결
- `/feed` 탭도 `MainFeed`를 사용하도록 통일
- 프로젝트 내부 문서 관리를 위한 `docs/` 디렉터리 구조 추가
- Figma 기준 top navigation / footer 업데이트
- Figma `About Us` 페이지를 `/about`에 연결
- 모든 작업마다 문서 업데이트를 남기는 운영 규칙 문서화
- `About Us`의 다크 전용 하드코딩 색상을 디자인 토큰 기준으로 정리
- `web`, `mobile` 탭을 Figma 기사 상세 화면 기반으로 공용 article detail 템플릿으로 전환
- `ui-ux` 탭도 공용 article detail 템플릿으로 통일
- FSD 2차 정리로 `MainCard`, `Search`, `ThemeToggle`를 `entities/features` 레이어로 이동
- Figma 루트 페이지(`0:1`) 기준으로 `MainFeed`, `ArticleDetail`의 최신 컴포넌트 패턴 반영
- Figma 모바일 chrome 기준으로 top app bar / bottom nav 반영

## Changed

- `apps/docs/app/docs/page.tsx`
- `apps/docs/app/feed/page.tsx`
- `apps/docs/widgets/main-feed/ui/main-feed.tsx`
- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `apps/docs/entities/document/ui/main-card.tsx`
- `apps/docs/feature/search/ui/search.tsx`
- `apps/docs/feature/theme-toggle/ui/theme-toggle.tsx`
- `apps/docs/app/about/page.tsx`
- `apps/docs/app/web/page.tsx`
- `apps/docs/app/mobile/page.tsx`
- `apps/docs/app/ui-ux/page.tsx`
- `apps/docs/widgets/main-feed/ui/main-feed.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `apps/docs/shared/layout/header.tsx`
- `apps/docs/shared/layout/mobile-bottom-nav.tsx`
- `apps/docs/app/layout.tsx`
- `apps/docs/shared/layout/footer.tsx`
- `apps/docs/shared/layout/header.tsx`
- `apps/docs/shared/navigation.tsx`
- `docs/README.md`
- `docs/process/codex-documentation-policy.md`
- `docs/architecture/adr-0001-docs-feed-main.md`
- `docs/architecture/adr-0002-about-us-page-and-shared-footer.md`
- `docs/architecture/docs-app-fsd.md`
- `docs/worklog/2026-04-29-codex-notes.md`

## Notes

- 원격 Figma MCP는 파일 권한 문제로 접근 실패
- 로컬 `figma-local` MCP로 노드 `1:2905` / `1:2906` 구조와 스크린샷 확인 후 구현 진행
- 현재 `MainFeed`는 Figma 전체 페이지 중 메인 본문만 반영
- 로컬 `figma-local` MCP로 노드 `1:3234` About Us 시안 확인 후 `/about` 구현
- footer는 About Figma 버전 기준으로 shared layout에 반영
- 이후 모든 Codex 작업은 `worklog` 갱신을 기본값으로 유지하기로 문서 기준 확정
- `design.md` 토큰은 shared theme에 반영되어 있었고, 라이트 모드 가독성 문제는 `about-us.tsx`의 `text-white`, `bg-[#0c0e14]`, `border-white/*` 같은 다크 전용 하드코딩에서 발생
- `About Us`는 `on-surface`, `outline`, `surface-container-*`, `primary-container` 중심으로 재정렬
- 로컬 `figma-local` MCP로 노드 `1:2728` 기사 상세 화면 확인 후 `web/mobile`에 공용 상세형 레이아웃 적용
- 기사 화면의 이미지 자산은 Figma 로컬 asset URL을 직접 사용
- 현재 `apps/docs`는 `shared`, `feature`, `components`가 혼재되어 있어 일부 재사용은 가능하지만 FSD 레이어가 명확히 정리된 상태는 아님
- `article-detail` 같은 페이지 단위 UI는 장기적으로 `widgets` 또는 `pages` 성격의 레이어로 분리하는 편이 더 자연스러움
- 1차 FSD 정리로 `MainFeed`, `AboutUs`, `ArticleDetail`를 `widgets/*/ui`로 이동하고 독립 FSD 문서 추가
- 2차 FSD 정리로 `MainCard`는 `entities/document`, `Search`와 `ThemeToggle`는 각 `feature/*/ui`로 이동
- 루트 Figma 페이지의 최신 상태를 확인한 결과, 현재 앱에서 차이가 큰 부분은 피드 내 pattern-injection 뉴스레터 카드와 모바일 article-detail 구조였음
- `ArticleDetail`은 모바일에서 sidebar를 숨기고 본문 내 newsletter card를 노출하도록 조정
- `MainFeed`는 카드 그리드 내부에 `Weekly_Patch_Notes` 스타일 뉴스레터 injection card를 추가하고 하단 중복 newsletter section은 제거
- 모바일 Figma 프레임(`57:1888`)을 기준으로 global mobile top app bar와 fixed bottom nav를 추가
- mobile bottom nav 높이만큼 layout content 하단 padding도 보정
- 이후 desktop 회귀를 확인했고, 원인은 `ArticleDetail`의 mobile/desktop 분기 기준이 `xl`로 잡혀 있어 `lg~xl` 구간에서 mobile newsletter가 노출되던 점이었음
- 이를 `lg` 기준으로 수정해 desktop sidebar와 mobile newsletter 노출 조건을 다시 분리
- Figma 루트 페이지의 `TopNavBar Shell`(`57:984`)과 현재 header를 다시 비교한 결과, 실제 앱은 `mobile: 56px / desktop: 65px`로 나뉘어 있어 더 얇게 느껴졌음
- header를 전 구간 `65px shell / 64px inner` 구조로 통일해 Figma 데스크톱 top bar 높이감에 맞춤
- article-detail 화면에서 Figma localhost asset URL이 깨지는 문제를 확인했고, 현재 활성화된 `Article Detail` 프레임(`57:2`) 기준 최신 자산을 다시 받아 `apps/docs/public/figma/article-detail`에 저장
- `widgets/article-detail/ui/article-detail.tsx`는 더 이상 `localhost:3845`를 직접 보지 않고 `/figma/article-detail/*` 정적 경로를 사용하도록 변경
- `app/layout.tsx`가 서버 컴포넌트인데 `react-i18next`의 `initReactI18next`를 직접 초기화하고 있어 `context-in-server-component` 계열 런타임 에러가 발생
- `shared/ui/brand.tsx`는 `Trans` 기반 클라이언트 컴포넌트 대신 서버 안전한 정적 브랜드 텍스트로 단순화하고, layout의 `react-i18next` 초기화 코드는 제거
- `next-intl` 기준으로 `shared/message/en.json`, `ko.json`의 메시지 구조를 다시 정리하고, `home`/`search` 카피 및 `common.brand`, `search.placeholder`를 추가
- `pnpm-workspace.yaml`에 기본 catalog와 `docs`, `web`, `fe-box`, `backend`, `ui` named catalog를 추가해 workspace 성격별 버전 묶음을 분리
- `apps/docs`, `apps/web`, `apps/fe-box`, `apps/web-backend`, `packages/api`, `packages/ui` 등 주요 workspace package.json은 `catalog:` / `catalog:<name>` 참조로 전환해 버전 기준점을 workspace 루트로 끌어올림
- 로컬 스크립트로 `package.json` 파싱과 catalog reference 정합성은 확인했고, `pnpm install --lockfile-only` 실검증은 현재 환경의 npm registry DNS 제한 때문에 완료하지 못함
- `apps/docs/widgets/about-us/ui/about-us.tsx`에서 `lucide-react`의 `Twitter` export가 더 이상 존재하지 않아 타입 에러가 발생했고, 이를 `react-icons/fa6`의 `FaXTwitter`로 교체
- `docs` 앱 반응형 기준을 app shell과 content layout로 분리하는 정책을 `docs/architecture/docs-responsive-policy.md`로 문서화
- 정책에 맞춰 app shell은 `sm` 기준으로 정렬하고, `Header`, `MobileNavDrawer`, `MobileBottomNav`, `layout` bottom padding, top navigation 표시 기준을 `sm` 중심으로 통일
- 코드, 기획, UI/UX, 디자인, 인프라를 한 곳에서 추적하기 위한 장기 개선 백로그 문서 `docs/todo/platform-improvement-todo.md`를 추가
- FSD 3차 정리로 `shared/layout`과 `shared/navigation`에 있던 app shell 조합 UI를 `widgets/app-shell`로 이동하고, `app/layout.tsx`는 해당 widget을 조합하는 얇은 엔트리로 정리
- 사용자 선호에 따라 `apps/docs` 내부의 barrel file(`index.ts`)을 정리했고, `app/layout.tsx`를 포함한 관련 import는 모두 개별 파일 경로를 직접 가리키도록 되돌림
- 왜 `shared`가 아니라 `widgets/app-shell`인지, 그리고 왜 이름을 `app-shell`로 정했는지 설명하는 독립 문서 `docs/architecture/docs-app-shell-rationale.md`를 추가
- `docs` 앱의 로딩 UX 기준을 정리한 `docs/architecture/docs-loading-ux-policy.md`를 추가하고, 전역 route transition은 top bar, 섹션 단위 로딩은 skeleton 중심으로 해석하는 방향을 문서화
- `turbo.json`의 공용 `dev` task에서 `dependsOn: ["^dev"]`를 제거했다. 기존 설정은 `docs#dev -> @web-tech/ui#dev`처럼 persistent watcher가 다른 persistent watcher에 의존하게 만들어 Turbo가 `Invalid task configuration`으로 즉시 실패했고, 현재 `apps/docs`, `apps/web`는 이미 `predev`에서 `@web-tech/ui build`를 선행하므로 공용 `dev` 의존 없이 부팅하는 편이 더 안전하다
- `main-feed` 카드 summary 문단에 `break-keep`을 추가해 한국어가 폭이 좁을 때 음절 단위로 세로처럼 쪼개져 보이는 현상을 완화
- 이후 카드 summary를 한 줄로만 보이게 하려는 요구에 맞춰 `main-feed`의 주요 summary 문단에 `truncate`를 추가하고 말줄임표 처리로 전환
- 한국어가 포함된 긴 summary에서 `truncate`가 덜 안정적으로 보이는 문제를 줄이기 위해 summary 블록과 부모 컨테이너에 `min-w-0`를 추가해 flex/grid 축소가 제대로 일어나도록 보강
- 이후 실제 브라우저 스크린샷을 기준으로 접근을 바꿔, `main-feed` summary에 `block w-full overflow-hidden text-ellipsis whitespace-nowrap`를 직접 명시하고 부모에도 `w-full min-w-0`를 부여해 한 줄 박스 동작을 강제
- 여전히 한국어 summary에서 폭 계산 이상이 남아 있어 CSS 한 줄 강제 전략을 버리고, `getDisplaySummary` 헬퍼로 카드별 표시 문자열 자체를 짧게 잘라 자연스럽게 한 줄 안에 들어오도록 방향 전환
- 이후 요구를 다시 정리해, summary는 한 줄 고정보다 “가능하면 한 줄, 넘치면 자연스럽게 다음 줄”이 더 중요하다고 보고 `getDisplaySummary`를 제거하고 원문 + `break-keep whitespace-normal` 조합으로 복귀
- `p` 태그 자체보다는 텍스트 언어 힌트와 줄바꿈 규칙 문제가 더 크다고 보고, summary 문단에 `lang`를 직접 부여하고 `:lang(ko)`에 `line-break`, `word-break`, `overflow-wrap` 규칙을 추가
- 그래도 세로 현상이 남아 있어 텍스트 자체보다 카드 내부 폭 수축을 의심했고, `main-feed` 카드 루트/래퍼/summary에 `w-full`, `self-stretch`, `min-w-0`, `max-w-none`를 추가해 summary가 카드 가용 폭 전체를 쓰도록 보강
- Figma `57:1723` 기준으로 mobile top bar 구조를 재정렬: 모바일은 `56px` 높이, 좌측 `menu + brand`, 우측 `search`만 보이도록 변경하고 가운데 브랜드/desktop nav 구조는 모바일에서 제거
- 데스크톱 top navigation은 좌우 영역 폭 차이 때문에 시각적 중심이 어긋나 보여, header 컨테이너를 `relative`로 두고 navigation을 `absolute left-1/2 -translate-x-1/2`로 고정해 정중앙 배치
- 이후 탭 중심 어긋남 원인을 active 상태 표시 CSS로 재판단했고, navigation의 active 표현을 `border-bottom` 기반에서 `after` 밑줄로 전환해 선택 표시가 레이아웃 box를 밀지 않도록 수정
- 블로그에 실제 노출될 markdown 콘텐츠 저장소 기준으로 DB 선택 문서를 추가했고, 기본 추천안을 `PostgreSQL` + 필요 시 `Meilisearch`/`pgvector` 확장 구조로 정리
- `docs` 앱의 블로그 콘텐츠는 원격 백엔드에서도 읽을 수 있게 방향을 확장했고, `BLOG_CONTENT_API_BASE_URL`, `BLOG_CONTENT_API_POSTS_PATH` 환경변수와 함께 `remote fetch -> local markdown fallback` 구조를 추가
- 이후 요구를 다시 맞춰, 백엔드에서는 게시물 메타데이터만 받고 본문 markdown는 NAS에서 별도 가져오는 구조를 지원하도록 `BLOG_CONTENT_MARKDOWN_BASE_URL`과 markdown path/url 필드 기반 2단계 fetch 로직을 추가
- markdown 본문 재요청 규칙을 더 구체화해, 응답의 `markdownPath` 계열 필드를 받으면 `${BLOG_CONTENT_MARKDOWN_BASE_URL}/posts/{markdownPath}` 형태로 요청하도록 `BLOG_CONTENT_MARKDOWN_PATH_PREFIX`를 추가
- 원격 콘텐츠 점검 결과 목록 조회에서도 모든 markdown 본문을 다시 받아오는 N+1 구조를 확인했고, 목록은 메타데이터만 받고 상세 페이지 진입 시에만 `/posts/{markdownPath}` 본문을 가져오도록 분리
- 상세 문서 페이지는 전체 목록을 불러와 `slug`를 찾는 방식 대신 `getDocBySlug`를 통해 원격 상세 1건만 조회하도록 변경
- 원격 목록 메타데이터에는 `markdownPath`를 유지하고, 검색은 제목/요약/슬러그 중심으로 동작하도록 정리
- 원격 본문 엔드포인트(`<BLOG_CONTENT_MARKDOWN_BASE_URL>/posts/test`) 연결을 직접 확인했고, 현재는 `200 OK`로 응답하지만 `text/html` 본문을 반환함을 확인
- 원격 본문 형식을 `markdown`으로 유지할지 `html`로 전환할지 비교했고, 현재 백엔드 엔드포인트 상태와 운영 편의성을 고려하면 단기적으로는 HTML 응답을 허용하는 쪽이 더 현실적이라는 판단을 기록
- 위 비교를 독립 문서 `docs/architecture/blog-content-html-vs-markdown.md`로 분리하고, 저장 포맷은 markdown 유지 + 전달 포맷은 HTML 허용인 하이브리드 방향을 현재 추천안으로 정리
- 원격 본문 fetch는 이제 `text/html`도 허용하고, 응답 `content-type` 및 본문 패턴을 기준으로 `html`/`mdx` 포맷을 추론하도록 변경
- 상세 문서 페이지는 `contentFormat === 'html'`이면 MDX 평가 대신 원격 HTML을 그대로 렌더링하고, 로컬 문서는 기존 MDX 파이프라인을 유지
- 목록 미노출 원인을 점검한 결과 `/api/posts`가 `{ results: [{ id, markdownPath }] }`만 반환하고 있어 `slug/title` 누락으로 전부 필터링되던 것을 확인했고, 테스트 편의를 위해 `id`와 `markdownPath`에서 `slug/title`을 유도하는 fallback 로직을 추가
- 이후 `MainFeed` 자체도 `summary/date`가 비어 있으면 문서를 버리고 있어 최소 응답이 다시 숨겨지는 문제를 확인했고, 피드에서는 `title/slug`만 필수로 보고 `summary`는 본문 또는 기본 문구로 보정하도록 수정
- 콘텐츠 API 구조 검토 결과, `api/posts -> markdownPath 조회` 후 `posts/{markdownPath}`로 본문을 다시 요청하는 2단계 자체는 이상하지 않으며, 목록은 메타데이터만, 상세는 본문만 가져오는 역할 분리가 실무적으로 자연스럽다는 판단을 기록
- 프론트/백엔드 정렬을 위해 `docs/architecture/blog-content-api-contract.md` 문서를 추가하고, `/api/posts` 목록 응답과 `/posts/{markdownPath}` HTML 본문 응답의 최소/권장 계약을 정리
- 현재 원격 콘텐츠 구조의 보안 리스크도 점검했고, raw HTML 렌더링, 원격 MDX 평가, 본문 URL 제어(SSRF 성격) 가능성을 `docs/architecture/blog-content-html-vs-markdown.md`에 별도 정리
- 이후 위험한 경로를 줄이기 위해 원격 MDX 평가는 사실상 차단하고, 원격 본문은 HTML만 허용하며, 절대 URL/상위 경로/백슬래시가 포함된 `markdownPath`는 거부하도록 보강
- 배포 환경용 base URL도 점검했고, `/api/posts`는 `{"results":[{"id":"test","markdownPath":"test.md"}]}`를 반환하지만 실제 본문은 `/posts/test.md`가 아니라 `/posts/test`에서만 `200 OK`가 나오는 계약 불일치를 확인
- Vercel/Turborepo 환경변수 경고를 줄이기 위해 `turbo.json`의 `globalEnv`에 `BETTER_AUTH_*`, `BLOG_CONTENT_*` 항목을 추가해 빌드 시 주입 대상임을 명시
- 로컬 env, `.env.example`, `turbo.json`, Vercel 등록값을 함께 확인할 수 있도록 `docs/runbooks/docs-env-checklist.md` 체크 기준표를 추가
- `DYNAMIC_SERVER_USAGE` 원인과 대응을 구조적으로 정리하기 위해 `docs/architecture/docs-content-rendering-strategy.md` 문서를 추가하고, `apps/docs`는 기본적으로 ISR 중심 전략이 적합하다는 기준을 기록
- 위 전략을 실제 코드에 반영해 `content-api.ts`의 원격 fetch를 `next.revalidate` 기반으로 전환하고, `BLOG_CONTENT_REVALIDATE_SECONDS` env를 추가

## Open Questions

- 카테고리 필터 버튼을 클라이언트 필터로 둘지, 라우트 이동으로 둘지
- main card와 feed card를 더 통합할지
- newsletter section을 실제 구독 기능과 연결할지
- about contact form을 실제 전송 기능과 연결할지
- footer/privacy/terms/changelog/github 링크를 어떤 실제 경로로 연결할지
- article-detail 화면을 `ui-ux`에도 확장할지 여부
- `components/`, `feature/`, `shared/`를 FSD 기준으로 재배치할지 여부
- app shell인 `header/footer/navigation`을 `shared`에 둘지 별도 shell/widget 레이어로 둘지 여부
- 루트 Figma의 다른 desktop/mobile feed 프레임도 추가로 코드에 1:1 반영할지 여부
- mobile nav icon을 Figma asset 기반으로 더 정밀하게 교체할지 여부
- `@web-tech/ui` 변경을 앱 dev 중 실시간 반영해야 할 때 watcher orchestration을 `turbo dev` 기준으로 어떻게 둘지 별도 기준이 필요한지

## Next

- `MainFeed` 필터 인터랙션 연결
- 데이터가 늘어났을 때 카드 우선순위 규칙 정리
- about contact/social/footer 링크 실제 연결
- about hero 및 creator 영역에 정식 자산을 쓸지 검토
- article-detail 내용을 실제 문서 데이터와 연결할지, 현재처럼 curated static spotlight로 유지할지 결정
- `docs` 앱 구조를 `shared / entities / features / widgets / pages` 기준으로 단계적으로 재정리할지 결정
- `shared/navigation` 및 `shared/layout/*`의 최종 레이어 위치 확정
- 최신 Figma root에 있는 별도 mobile feed / alternate feed 프레임까지 구현 범위를 넓힐지 결정
- `turbo dev`에서 persistent dependency를 직접 연결하지 않는 현재 정책에 맞춰, 필요하면 `ui watch + app dev` 병렬 실행 전략을 별도 runbook으로 정리

- Figma node `88:2026` 기준으로 모바일 header menu trigger에 좌측 navigation drawer(320px, overlay, active state, technical stats, bottom action section)를 추가

- shadcn manual 구조 기준으로 `packages/ui`를 source of truth로 다시 보고, docs의 mobile drawer를 `@web-tech/ui/components/sheet` 기반으로 전환하고 `Input/Sidebar` import도 `@web-tech/ui`로 명시 정리

- docs 전반에 남아 있던 `@/lib/utils` alias import도 `@web-tech/ui/lib/utils`로 통일해 packages/ui를 shadcn/ui와 공용 유틸의 단일 source로 더 명확히 정리
- 이어서 `apps/docs/tsconfig.json`의 `@/* -> packages/ui/*` alias 제거도 시도했지만, 현재 `@web-tech/ui`가 소스 TS를 직접 export하고 있고 내부 구현이 아직 `@/components`, `@/lib`, `@/hooks` alias를 사용하고 있어 `docs` 소비 앱 쪽 alias 해석이 여전히 필요하다는 점을 확인

- docs 앱에서는 더 이상 `@/* -> packages/ui/*` alias가 필요하지 않아 `apps/docs/tsconfig.json`에서 제거하고, import 경로는 `@web-tech/ui`와 `~/*` 기준으로 정리된 상태를 확정
- `packages/ui/components/ui/*`와 `packages/ui/components/ui/sidebar.tsx` 내부의 `@/...` source import를 상대 경로로 정리해, 실제 런타임 소스 기준으로는 더 이상 소비 앱이 `packages/ui` 내부 alias를 해석할 필요가 없게 되었음
- `packages/ui/components.json`에 남아 있는 `@/lib/utils`, `@/components/ui` alias는 shadcn CLI 설정용 메타데이터로 유지하고, `pnpm --filter docs exec tsc --noEmit` 통과로 `apps/docs/tsconfig.json`에서 `@/* -> ../../packages/ui/*` 매핑을 제거한 상태가 유효함을 확인
- 이후 `packages/ui`를 source export에서 build export로 전환하기로 결정하고, `tsconfig.build.json` + `dist` 기반 `exports` + `build/dev` 스크립트를 추가했으며, Turbo `build/dev`도 `dist` 산출물과 의존 패키지 watch를 고려하도록 조정
- `apps/docs`, `apps/web`에는 `prebuild` / `predev`로 `@web-tech/ui build`를 먼저 수행하는 hook을 넣어 앱 단독 실행이나 배포 빌드에서도 `ui` 산출물이 누락되지 않도록 보강
- 검증 기준으로 `pnpm --filter @web-tech/ui build`와 `pnpm --filter docs exec tsc --noEmit`는 통과했고, `docs`의 `next build`는 `prebuild -> ui build -> next build` 흐름 진입까지 확인했지만 세션 중 남아 있던 별도 `next build` lock 때문에 완료 로그는 다시 확보하지 못함
- 이후 `pnpm --filter docs build`에서 `/category` 페이지 수집 중 `f.createContext is not a function` 에러를 재현했고, 원인은 build export로 전환된 `@web-tech/ui`를 `apps/docs`의 Next 설정에서 `transpilePackages`로 처리하지 않아 client boundary와 패키지 모듈 해석이 어긋나던 점으로 판단
- `apps/docs/next.config.mjs`에 `transpilePackages: ['@web-tech/ui']`를 추가해 `apps/web`와 동일한 기준으로 맞췄고, 수정 후에는 동일한 `/category` 즉시 실패 지점은 재현되지 않음을 확인
- 추가로 `packages/ui`의 build 산출물이 `@emotion/react/jsx-runtime`를 직접 물고 있어 `/category` 번들에 Emotion runtime이 불필요하게 깊게 들어가는 점을 확인했고, `tsconfig.build.json`에서 `jsxImportSource`를 `react`로 override해 일반 shadcn/ui 컴포넌트 산출물은 `react/jsx-runtime`를 사용하도록 조정
- 조정 후 `packages/ui/dist/components/ui/badge.js` 등은 실제로 `react/jsx-runtime`를 import하도록 바뀌었고, 동일한 `pnpm --filter docs build`에서 이전처럼 `/category` 수집 직전에 `createContext` 에러가 즉시 재현되지는 않음을 재확인
- 지금까지의 build export 전환 이슈, 해결 과정, 남은 고민점, 읽어볼 코드와 학습 포인트를 독립 문서 `docs/architecture/ui-build-export-retrospective.md`로 분리 정리
