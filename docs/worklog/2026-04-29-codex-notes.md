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
- `http://192.168.0.7:8000/posts/test` 엔드포인트 연결을 직접 확인했고, 현재는 `200 OK`로 응답하지만 `text/html` 본문을 반환함을 확인
- 원격 본문 형식을 `markdown`으로 유지할지 `html`로 전환할지 비교했고, 현재 백엔드 엔드포인트 상태와 운영 편의성을 고려하면 단기적으로는 HTML 응답을 허용하는 쪽이 더 현실적이라는 판단을 기록
- 위 비교를 독립 문서 `docs/architecture/blog-content-html-vs-markdown.md`로 분리하고, 저장 포맷은 markdown 유지 + 전달 포맷은 HTML 허용인 하이브리드 방향을 현재 추천안으로 정리
- 원격 본문 fetch는 이제 `text/html`도 허용하고, 응답 `content-type` 및 본문 패턴을 기준으로 `html`/`mdx` 포맷을 추론하도록 변경
- 상세 문서 페이지는 `contentFormat === 'html'`이면 MDX 평가 대신 원격 HTML을 그대로 렌더링하고, 로컬 문서는 기존 MDX 파이프라인을 유지
- 목록 미노출 원인을 점검한 결과 `/api/posts`가 `{ results: [{ id, markdownPath }] }`만 반환하고 있어 `slug/title` 누락으로 전부 필터링되던 것을 확인했고, 테스트 편의를 위해 `id`와 `markdownPath`에서 `slug/title`을 유도하는 fallback 로직을 추가
- 이후 `MainFeed` 자체도 `summary/date`가 비어 있으면 문서를 버리고 있어 최소 응답이 다시 숨겨지는 문제를 확인했고, 피드에서는 `title/slug`만 필수로 보고 `summary`는 본문 또는 기본 문구로 보정하도록 수정
- 콘텐츠 API 구조 검토 결과, `api/posts -> markdownPath 조회` 후 `posts/{markdownPath}`로 본문을 다시 요청하는 2단계 자체는 이상하지 않으며, 목록은 메타데이터만, 상세는 본문만 가져오는 역할 분리가 실무적으로 자연스럽다는 판단을 기록
- 프론트/백엔드 정렬을 위해 `docs/architecture/blog-content-api-contract.md` 문서를 추가하고, `/api/posts` 목록 응답과 `/posts/{markdownPath}` HTML 본문 응답의 최소/권장 계약을 정리

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

## Next

- `MainFeed` 필터 인터랙션 연결
- 데이터가 늘어났을 때 카드 우선순위 규칙 정리
- about contact/social/footer 링크 실제 연결
- about hero 및 creator 영역에 정식 자산을 쓸지 검토
- article-detail 내용을 실제 문서 데이터와 연결할지, 현재처럼 curated static spotlight로 유지할지 결정
- `docs` 앱 구조를 `shared / entities / features / widgets / pages` 기준으로 단계적으로 재정리할지 결정
- `shared/navigation` 및 `shared/layout/*`의 최종 레이어 위치 확정
- 최신 Figma root에 있는 별도 mobile feed / alternate feed 프레임까지 구현 범위를 넓힐지 결정
