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

## Changed

- `apps/docs/components/main-feed.tsx`
- `apps/docs/app/docs/page.tsx`
- `apps/docs/app/feed/page.tsx`
- `apps/docs/widgets/main-feed/ui/main-feed.tsx`
- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `apps/docs/widgets/article-detail/ui/article-detail.tsx`
- `apps/docs/app/about/page.tsx`
- `apps/docs/app/web/page.tsx`
- `apps/docs/app/mobile/page.tsx`
- `apps/docs/app/ui-ux/page.tsx`
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

## Open Questions

- 카테고리 필터 버튼을 클라이언트 필터로 둘지, 라우트 이동으로 둘지
- main card와 feed card를 더 통합할지
- newsletter section을 실제 구독 기능과 연결할지
- about contact form을 실제 전송 기능과 연결할지
- footer/privacy/terms/changelog/github 링크를 어떤 실제 경로로 연결할지
- article-detail 화면을 `ui-ux`에도 확장할지 여부
- `components/`, `feature/`, `shared/`를 FSD 기준으로 재배치할지 여부

## Next

- `MainFeed` 필터 인터랙션 연결
- 데이터가 늘어났을 때 카드 우선순위 규칙 정리
- about contact/social/footer 링크 실제 연결
- about hero 및 creator 영역에 정식 자산을 쓸지 검토
- article-detail 내용을 실제 문서 데이터와 연결할지, 현재처럼 curated static spotlight로 유지할지 결정
- `docs` 앱 구조를 `shared / entities / features / widgets / pages` 기준으로 단계적으로 재정리할지 결정
