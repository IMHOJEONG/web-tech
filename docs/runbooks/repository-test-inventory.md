# 저장소 테스트 목록과 실행 경로

## 목적과 준비 조건

- 목록 확인일: 2026-10-12, Asia/Seoul.
- 대상: `feature/docs`, HEAD `d8c0952`와 현재 미커밋 작업 트리.
- 목적: 전수 검사 전에 테스트 파일, 실행 명령, CI 연결을 구분한다.
- 테스트 실행 결과: 이번 작업에서는 실행하지 않았다. 아래 CI 표시는 설정에 호출 경로가 있다는 뜻이지 통과 여부가 아니다.
- 파일 집계: 테스트 파일 131개. 현재 검사 대상 129개와 과거 실험 증거 2개.
- Git 추적: 128개 추적, 3개 미추적. 미추적 파일은 현재 로컬 목록에만 있으며 커밋 전 원격 CI에 포함되지 않는다.
- 개수는 파일 수다. 파라미터·브라우저 프로젝트·반복문으로 생성되는 테스트 케이스 수와 다르다.
- 실행 준비: 저장소 루트, mise의 프로젝트 Node.js 24, pnpm 설치 및 해당 suite의 사전 빌드/브라우저 설치. 명령 앞에 `mise exec --`를 사용한다.

## 실행 순서

먼저 아래 파일 목록과 실행 계약을 확인한다. 실제 전수 실행은 별도 단계이며 현재 개발 서버를 자동 종료하거나 인증된 외부 API를 일괄 호출하지 않는다.

### 실행 명령과 CI 경로

| 범위                            | 루트에서 실행할 명령                                                | CI 연결                                                      |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Backend 단위·콘텐츠 계약        | `pnpm test`                                                         | 있음; `turbo test`로 각 패키지의 정확한 `test` 스크립트 실행 |
| 저장소 검사기                   | `pnpm test:repo`                                                    | 있음                                                         |
| 블로그 로직                     | `pnpm --filter docs test:lib`                                       | 있음                                                         |
| 콘텐츠 작성 규칙·게시 CLI       | `pnpm --filter docs test:content`                                   | 있음; font-preload 파일 제외                                 |
| 일반 화면                       | `pnpm --filter docs test:e2e`                                       | 있음                                                         |
| production 상세·게시·스트리밍   | `pnpm --filter docs test:article:prod`                              | 있음                                                         |
| 공용 UI 프리미티브·tarball 소비 | `pnpm --filter docs test:ui`                                        | 있음                                                         |
| 공용 UI 실제 앱 소비            | `pnpm --filter docs test:ui:consumer`                               | 있음; 일반 E2E의 Drawer·주제 필터 파일을 재사용              |
| Docs Backend API                | `pnpm --filter docs-backend test:e2e --runInBand`                   | 있음                                                         |
| Vuln Radar Backend API          | `pnpm --filter vuln-radar-backend test:e2e --runInBand`             | 명시 호출 없음                                               |
| CRP 서버·브라우저               | `pnpm test:crp-lab`, `pnpm test:crp-lab:browser`                    | 있음                                                         |
| 코드 접기 브라우저              | `pnpm --filter docs test:code-block`                                | 명시 호출 없음                                               |
| React Activity 브라우저         | `pnpm --filter docs test:activity-lab`                              | 명시 호출 없음                                               |
| 푸시 브라우저                   | `pnpm --filter docs test:push:browser`                              | 명시 호출 없음                                               |
| 폰트 preload 단위               | `pnpm --filter docs exec node --test scripts/font-preload.test.mjs` | 명시 호출 없음                                               |

**주의: 루트 `pnpm test`만 실행하면 전체 검사가 아니다.** docs 앱에는 정확히 `test`라는 스크립트가 없으며 `test:lib`, `test:content`, E2E는 별도로 호출해야 한다. Backend의 `test:e2e`도 `test`와 별개다.

CI 연결 판단은 [CI 워크플로](../../.github/workflows/ci.yml), [Documentation 워크플로](../../.github/workflows/documentation.yml), [루트 스크립트](../../package.json), [Turbo 설정](../../turbo.json) 및 각 앱 package.json을 대조했다. 이미지 게시 워크플로는 테스트 suite 명령을 직접 호출하지 않는다.

### 파일별 전체 목록

#### Docs 로직 단위 테스트

57개 · Node.js test runner · `pnpm --filter docs test:lib` · CI 호출 있음.

- [apps/docs/feature/callout/model/callout.test.ts](../../apps/docs/feature/callout/model/callout.test.ts)
- [apps/docs/feature/callout/model/react-callout.test.ts](../../apps/docs/feature/callout/model/react-callout.test.ts)
- [apps/docs/feature/code-block/lib/code-disclosure.test.ts](../../apps/docs/feature/code-block/lib/code-disclosure.test.ts)
- [apps/docs/feature/code-block/lib/highlight-code.test.ts](../../apps/docs/feature/code-block/lib/highlight-code.test.ts)
- [apps/docs/lib/aria-content-consolidation.test.ts](../../apps/docs/lib/aria-content-consolidation.test.ts)
- [apps/docs/lib/article-diagram-sources.test.ts](../../apps/docs/lib/article-diagram-sources.test.ts) — 미추적
- [apps/docs/lib/article-metadata.test.ts](../../apps/docs/lib/article-metadata.test.ts)
- [apps/docs/lib/article-og-cache.test.ts](../../apps/docs/lib/article-og-cache.test.ts)
- [apps/docs/lib/article-reading-navigation.test.ts](../../apps/docs/lib/article-reading-navigation.test.ts)
- [apps/docs/lib/article-related-documents.test.ts](../../apps/docs/lib/article-related-documents.test.ts)
- [apps/docs/lib/article-sharing.test.ts](../../apps/docs/lib/article-sharing.test.ts)
- [apps/docs/lib/article-timing.test.ts](../../apps/docs/lib/article-timing.test.ts)
- [apps/docs/lib/better-stack.test.ts](../../apps/docs/lib/better-stack.test.ts)
- [apps/docs/lib/category-i18n.test.ts](../../apps/docs/lib/category-i18n.test.ts)
- [apps/docs/lib/content-api-config.test.ts](../../apps/docs/lib/content-api-config.test.ts)
- [apps/docs/lib/content-api-observability.test.ts](../../apps/docs/lib/content-api-observability.test.ts)
- [apps/docs/lib/content-api-schema.test.ts](../../apps/docs/lib/content-api-schema.test.ts)
- [apps/docs/lib/content-cache.test.ts](../../apps/docs/lib/content-cache.test.ts)
- [apps/docs/lib/content-source-log.test.ts](../../apps/docs/lib/content-source-log.test.ts)
- [apps/docs/lib/content-source-policy.test.ts](../../apps/docs/lib/content-source-policy.test.ts)
- [apps/docs/lib/docs-config-contract.test.ts](../../apps/docs/lib/docs-config-contract.test.ts)
- [apps/docs/lib/docs-empty-page.test.ts](../../apps/docs/lib/docs-empty-page.test.ts)
- [apps/docs/lib/docs-search-page-state.test.ts](../../apps/docs/lib/docs-search-page-state.test.ts)
- [apps/docs/lib/editorial-metadata.test.ts](../../apps/docs/lib/editorial-metadata.test.ts)
- [apps/docs/lib/get-category.test.ts](../../apps/docs/lib/get-category.test.ts)
- [apps/docs/lib/get-doc-route.test.ts](../../apps/docs/lib/get-doc-route.test.ts)
- [apps/docs/lib/local-content-paths.test.ts](../../apps/docs/lib/local-content-paths.test.ts)
- [apps/docs/lib/local-document-parser.test.ts](../../apps/docs/lib/local-document-parser.test.ts) — 미커밋 수정 있음
- [apps/docs/lib/local-draft-preview.test.ts](../../apps/docs/lib/local-draft-preview.test.ts) — 미추적
- [apps/docs/lib/local-markdown-files.test.ts](../../apps/docs/lib/local-markdown-files.test.ts)
- [apps/docs/lib/local-search-index.test.ts](../../apps/docs/lib/local-search-index.test.ts)
- [apps/docs/lib/page-metadata.test.ts](../../apps/docs/lib/page-metadata.test.ts)
- [apps/docs/lib/push-access-policy.test.ts](../../apps/docs/lib/push-access-policy.test.ts)
- [apps/docs/lib/push-request-policy.test.ts](../../apps/docs/lib/push-request-policy.test.ts)
- [apps/docs/lib/push-service-worker.test.ts](../../apps/docs/lib/push-service-worker.test.ts)
- [apps/docs/lib/rehype-public-images.test.ts](../../apps/docs/lib/rehype-public-images.test.ts) — 미추적
- [apps/docs/lib/remote-html-sanitizer.test.ts](../../apps/docs/lib/remote-html-sanitizer.test.ts)
- [apps/docs/lib/render-article-content.test.ts](../../apps/docs/lib/render-article-content.test.ts)
- [apps/docs/lib/request-blocklist.test.ts](../../apps/docs/lib/request-blocklist.test.ts)
- [apps/docs/lib/runtime-observation.test.ts](../../apps/docs/lib/runtime-observation.test.ts)
- [apps/docs/lib/search-api-response.test.ts](../../apps/docs/lib/search-api-response.test.ts)
- [apps/docs/lib/search-preview.test.ts](../../apps/docs/lib/search-preview.test.ts)
- [apps/docs/lib/search-query.test.ts](../../apps/docs/lib/search-query.test.ts)
- [apps/docs/lib/search-ranking.test.ts](../../apps/docs/lib/search-ranking.test.ts)
- [apps/docs/lib/search-result-contract.test.ts](../../apps/docs/lib/search-result-contract.test.ts)
- [apps/docs/lib/seo.test.ts](../../apps/docs/lib/seo.test.ts)
- [apps/docs/lib/sitemap.test.ts](../../apps/docs/lib/sitemap.test.ts)
- [apps/docs/lib/slugify-heading.test.ts](../../apps/docs/lib/slugify-heading.test.ts)
- [apps/docs/shared/config/locale-path.test.ts](../../apps/docs/shared/config/locale-path.test.ts)
- [apps/docs/shared/config/react-inspection-tools.test.ts](../../apps/docs/shared/config/react-inspection-tools.test.ts)
- [apps/docs/widgets/app-shell/model/app-navigation.test.ts](../../apps/docs/widgets/app-shell/model/app-navigation.test.ts)
- [apps/docs/widgets/content-hub/model/hub-topic-filter.test.ts](../../apps/docs/widgets/content-hub/model/hub-topic-filter.test.ts)
- [apps/docs/widgets/content-hub/model/uiux-hub-docs.test.ts](../../apps/docs/widgets/content-hub/model/uiux-hub-docs.test.ts)
- [apps/docs/widgets/docs-index/model/content-collections.test.ts](../../apps/docs/widgets/docs-index/model/content-collections.test.ts)
- [apps/docs/widgets/docs-index/model/docs-index-controls.test.ts](../../apps/docs/widgets/docs-index/model/docs-index-controls.test.ts)
- [apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts](../../apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts)
- [apps/docs/widgets/docs-index/model/docs-index-summary.test.ts](../../apps/docs/widgets/docs-index/model/docs-index-summary.test.ts)

#### Docs 콘텐츠·스크립트 테스트

5개 · Node.js test runner · `test:content`는 아래 4개를 호출하며 `font-preload.test.mjs`는 포함하지 않음.

- [apps/docs/scripts/assert-content-response.test.mjs](../../apps/docs/scripts/assert-content-response.test.mjs)
- [apps/docs/scripts/content-publication.test.ts](../../apps/docs/scripts/content-publication.test.ts)
- [apps/docs/scripts/font-preload.test.mjs](../../apps/docs/scripts/font-preload.test.mjs)
- [apps/docs/scripts/validate-content-style.test.mjs](../../apps/docs/scripts/validate-content-style.test.mjs)
- [apps/docs/scripts/validate-content.test.mjs](../../apps/docs/scripts/validate-content.test.mjs)

#### Docs 일반 화면 E2E

27개 · Playwright · `pnpm --filter docs test:e2e` · CI 호출 있음. Chromium 모바일·태블릿·데스크톱 프로젝트.

- [apps/docs/e2e/about-author.spec.ts](../../apps/docs/e2e/about-author.spec.ts)
- [apps/docs/e2e/article-anchor-scroll.spec.ts](../../apps/docs/e2e/article-anchor-scroll.spec.ts)
- [apps/docs/e2e/article-shell-stability.spec.ts](../../apps/docs/e2e/article-shell-stability.spec.ts)
- [apps/docs/e2e/article-sticky-header.spec.ts](../../apps/docs/e2e/article-sticky-header.spec.ts)
- [apps/docs/e2e/category-localization.spec.ts](../../apps/docs/e2e/category-localization.spec.ts)
- [apps/docs/e2e/content-discovery.spec.ts](../../apps/docs/e2e/content-discovery.spec.ts)
- [apps/docs/e2e/docs-empty-state.spec.ts](../../apps/docs/e2e/docs-empty-state.spec.ts)
- [apps/docs/e2e/docs-index-navigation.spec.ts](../../apps/docs/e2e/docs-index-navigation.spec.ts)
- [apps/docs/e2e/docs-index-pagination.spec.ts](../../apps/docs/e2e/docs-index-pagination.spec.ts)
- [apps/docs/e2e/docs-touch-target.spec.ts](../../apps/docs/e2e/docs-touch-target.spec.ts)
- [apps/docs/e2e/feed-lead-story.spec.ts](../../apps/docs/e2e/feed-lead-story.spec.ts)
- [apps/docs/e2e/feed-recent-articles.spec.ts](../../apps/docs/e2e/feed-recent-articles.spec.ts)
- [apps/docs/e2e/header-clarity.spec.ts](../../apps/docs/e2e/header-clarity.spec.ts)
- [apps/docs/e2e/header-font-preference.spec.ts](../../apps/docs/e2e/header-font-preference.spec.ts)
- [apps/docs/e2e/horizontal-overflow.spec.ts](../../apps/docs/e2e/horizontal-overflow.spec.ts)
- [apps/docs/e2e/hub-topic-filters.spec.ts](../../apps/docs/e2e/hub-topic-filters.spec.ts)
- [apps/docs/e2e/keyboard-accessibility.spec.ts](../../apps/docs/e2e/keyboard-accessibility.spec.ts)
- [apps/docs/e2e/mobile-drawer-close.spec.ts](../../apps/docs/e2e/mobile-drawer-close.spec.ts)
- [apps/docs/e2e/mobile-drawer-resize.spec.ts](../../apps/docs/e2e/mobile-drawer-resize.spec.ts)
- [apps/docs/e2e/search-navigation.spec.ts](../../apps/docs/e2e/search-navigation.spec.ts)
- [apps/docs/e2e/search-query-policy.spec.ts](../../apps/docs/e2e/search-query-policy.spec.ts)
- [apps/docs/e2e/shell-active-navigation.spec.ts](../../apps/docs/e2e/shell-active-navigation.spec.ts)
- [apps/docs/e2e/shell-focus-contrast.spec.ts](../../apps/docs/e2e/shell-focus-contrast.spec.ts)
- [apps/docs/e2e/shell-navigation.spec.ts](../../apps/docs/e2e/shell-navigation.spec.ts)
- [apps/docs/e2e/skip-link.spec.ts](../../apps/docs/e2e/skip-link.spec.ts)
- [apps/docs/e2e/static-pages-layout.spec.ts](../../apps/docs/e2e/static-pages-layout.spec.ts)
- [apps/docs/e2e/uiux-compact-cards.spec.ts](../../apps/docs/e2e/uiux-compact-cards.spec.ts)

#### Docs 상세 페이지 E2E

13개 · Playwright · `pnpm --filter docs test:article:prod` · CI 호출 있음. 로컬 production 빌드와 콘텐츠 fixture 서버를 사용하며 운영 사이트 직접 검사가 아님.

- [apps/docs/article-e2e/article-detail.spec.ts](../../apps/docs/article-e2e/article-detail.spec.ts)
- [apps/docs/article-e2e/article-legacy-redirect.spec.ts](../../apps/docs/article-e2e/article-legacy-redirect.spec.ts)
- [apps/docs/article-e2e/article-sharing.spec.ts](../../apps/docs/article-e2e/article-sharing.spec.ts)
- [apps/docs/article-e2e/article-streaming.spec.ts](../../apps/docs/article-e2e/article-streaming.spec.ts)
- [apps/docs/article-e2e/category-boundary.spec.ts](../../apps/docs/article-e2e/category-boundary.spec.ts)
- [apps/docs/article-e2e/content-publication-cli.spec.ts](../../apps/docs/article-e2e/content-publication-cli.spec.ts)
- [apps/docs/article-e2e/content-publication.spec.ts](../../apps/docs/article-e2e/content-publication.spec.ts)
- [apps/docs/article-e2e/local-content-tracing.spec.ts](../../apps/docs/article-e2e/local-content-tracing.spec.ts)
- [apps/docs/article-e2e/local-document-reads.spec.ts](../../apps/docs/article-e2e/local-document-reads.spec.ts)
- [apps/docs/article-e2e/local-index-consistency.spec.ts](../../apps/docs/article-e2e/local-index-consistency.spec.ts)
- [apps/docs/article-e2e/request-lifecycle-next.spec.ts](../../apps/docs/article-e2e/request-lifecycle-next.spec.ts)
- [apps/docs/article-e2e/request-lifecycle.spec.ts](../../apps/docs/article-e2e/request-lifecycle.spec.ts)
- [apps/docs/article-e2e/runtime-observation.spec.ts](../../apps/docs/article-e2e/runtime-observation.spec.ts)

#### 공용 UI 브라우저 테스트

4개 · Playwright · `pnpm --filter docs test:ui` · CI 호출 있음. 공용 패키지의 검사가 docs 소비 앱에 위치함.

- [apps/docs/ui-e2e/cn.spec.ts](../../apps/docs/ui-e2e/cn.spec.ts)
- [apps/docs/ui-e2e/packed-consumer.spec.ts](../../apps/docs/ui-e2e/packed-consumer.spec.ts)
- [apps/docs/ui-e2e/primitives.spec.ts](../../apps/docs/ui-e2e/primitives.spec.ts)
- [apps/docs/ui-e2e/sidebar-hydration.spec.ts](../../apps/docs/ui-e2e/sidebar-hydration.spec.ts)

#### Docs 별도 브라우저 실험

4개 · 아래 명령으로 별도 실행. CRP만 CI에서 명시적으로 호출함.

- [apps/docs/activity-e2e/activity-focus.spec.ts](../../apps/docs/activity-e2e/activity-focus.spec.ts)
- [apps/docs/code-block-e2e/code-disclosure.spec.ts](../../apps/docs/code-block-e2e/code-disclosure.spec.ts)
- [apps/docs/crp-e2e/critical-rendering-path.spec.ts](../../apps/docs/crp-e2e/critical-rendering-path.spec.ts)
- [apps/docs/e2e-push/subscription.spec.ts](../../apps/docs/e2e-push/subscription.spec.ts)

#### Docs Backend

5개 · Jest/ts-jest · src 단위 테스트 3개와 API E2E 2개. 모두 CI 실행 경로 있음.

- [apps/docs-backend/src/config/content-config.service.spec.ts](../../apps/docs-backend/src/config/content-config.service.spec.ts)
- [apps/docs-backend/src/modules/content/content-assets.spec.ts](../../apps/docs-backend/src/modules/content/content-assets.spec.ts)
- [apps/docs-backend/src/modules/content/content-path.spec.ts](../../apps/docs-backend/src/modules/content/content-path.spec.ts)
- [apps/docs-backend/test/app.e2e-spec.ts](../../apps/docs-backend/test/app.e2e-spec.ts)
- [apps/docs-backend/test/push.e2e-spec.ts](../../apps/docs-backend/test/push.e2e-spec.ts)

#### Vuln Radar Backend

8개 · Jest/ts-jest · src 단위 테스트 7개는 루트 `pnpm test`를 통해 CI 실행. API E2E 1개는 CI 명시 호출 없음.

- [apps/vuln-radar-backend/src/modules/feeds/feeds.controller.spec.ts](../../apps/vuln-radar-backend/src/modules/feeds/feeds.controller.spec.ts)
- [apps/vuln-radar-backend/src/modules/health/health.controller.spec.ts](../../apps/vuln-radar-backend/src/modules/health/health.controller.spec.ts)
- [apps/vuln-radar-backend/src/modules/ingest/ingest-scheduler.service.spec.ts](../../apps/vuln-radar-backend/src/modules/ingest/ingest-scheduler.service.spec.ts)
- [apps/vuln-radar-backend/src/modules/ingest/ingest.controller.spec.ts](../../apps/vuln-radar-backend/src/modules/ingest/ingest.controller.spec.ts)
- [apps/vuln-radar-backend/src/modules/watchlist/watchlist.controller.spec.ts](../../apps/vuln-radar-backend/src/modules/watchlist/watchlist.controller.spec.ts)
- [apps/vuln-radar-backend/src/shared/guards/backend-auth.guard.spec.ts](../../apps/vuln-radar-backend/src/shared/guards/backend-auth.guard.spec.ts)
- [apps/vuln-radar-backend/src/shared/lib/risk-score.spec.ts](../../apps/vuln-radar-backend/src/shared/lib/risk-score.spec.ts)
- [apps/vuln-radar-backend/test/app.e2e-spec.ts](../../apps/vuln-radar-backend/test/app.e2e-spec.ts)

#### 공용 콘텐츠 계약

2개 · Node.js test runner · `pnpm --filter @web-tech/docs-content-contract test` · 루트 `pnpm test`를 통해 CI 실행.

- [packages/docs-content-contract/src/body-style.test.ts](../../packages/docs-content-contract/src/body-style.test.ts)
- [packages/docs-content-contract/src/index.test.ts](../../packages/docs-content-contract/src/index.test.ts)

#### 저장소 검사기

3개 · Node.js test runner · `pnpm test:repo` · CI와 Documentation 워크플로에서 호출.

- [scripts/documentation-checks.test.mjs](../../scripts/documentation-checks.test.mjs)
- [scripts/security-dependencies.test.mjs](../../scripts/security-dependencies.test.mjs)
- [scripts/validate-catalog-references.test.mjs](../../scripts/validate-catalog-references.test.mjs)

#### CRP 예제 서버

1개 · Node.js test runner · `pnpm test:crp-lab` · CI 호출 있음.

- [docs/examples/critical-rendering-path-lab/server.test.ts](../../docs/examples/critical-rendering-path-lab/server.test.ts)

#### 과거 실험 증거

2개 · 현재 일반 테스트 명령에 연결된 제품 테스트와 분리. 재실행 가능성·유효성은 아직 검토하지 않음.

- [docs/verification/artifacts/2026-09-20-canvas-snippet.test.mjs](../../docs/verification/artifacts/2026-09-20-canvas-snippet.test.mjs)
- [docs/verification/artifacts/2026-09-22-event-loop-browser.test.mjs](../../docs/verification/artifacts/2026-09-22-event-loop-browser.test.mjs)

### 별도 검증·측정 스크립트

아래 파일은 일반 `.test`/`.spec` 집계에 포함하지 않는다. 자체 assert, 배포 환경 검사, 측정 또는 통합 실행을 수행하므로 후속 전수 검사에서 실행 조건을 따로 확인해야 한다.

| 파일                                                                                           | 역할·호출                                                                                    |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [test-shared-ui-package.ts](../../apps/docs/scripts/test-shared-ui-package.ts)                 | `test:ui:package`; tarball 소비 환경 준비·정리. 같은 helper는 packed-consumer E2E에서도 사용 |
| [test-content-cache-prod.mjs](../../apps/docs/scripts/test-content-cache-prod.mjs)             | `test:cache:prod`; 격리 production 캐시·언어 경계·웹훅 검사                                  |
| [test-better-stack-local.mjs](../../apps/docs/scripts/test-better-stack-local.mjs)             | `test:better-stack:local`; Better Stack 토큰·수집 URL 필요, 실제 외부 전송 영향 검토 필요    |
| [verify-web-push-local.ts](../../apps/docs/scripts/verify-web-push-local.ts)                   | `test:push:local`; 프론트·백엔드·브라우저 통합 푸시 검사                                     |
| [check-prod-routes.mjs](../../apps/docs/scripts/check-prod-routes.mjs)                         | `check:prod-routes`; 지정 origin의 라우트 응답·시간 검사                                     |
| [check-code-block-usability.ts](../../apps/docs/scripts/check-code-block-usability.ts)         | 코드 블록 다중 브라우저·사용성 관측과 증거 저장                                              |
| [check-dialog-focus-example.ts](../../apps/docs/scripts/check-dialog-focus-example.ts)         | 글의 Dialog 예제 키보드·포커스 복귀 assertion                                                |
| [verify-deployed-fonts.cjs](../../apps/docs/scripts/verify-deployed-fonts.cjs)                 | 배포 폰트 preload·본문·코드 폰트 assertion                                                   |
| [verify-deployed-article-shell.cjs](../../apps/docs/scripts/verify-deployed-article-shell.cjs) | 배포 상세 셸 안정성 관측                                                                     |
| [measure-deployed-performance.mjs](../../apps/docs/scripts/measure-deployed-performance.mjs)   | 배포 성능 측정                                                                               |
| [measure-shared-ui-bundle.ts](../../apps/docs/scripts/measure-shared-ui-bundle.ts)             | 공용 UI fixture 번들 크기 측정                                                               |
| [trace-deployed-rendering.cjs](../../apps/docs/scripts/trace-deployed-rendering.cjs)           | 배포 렌더링 trace 수집                                                                       |

위 독립 스크립트는 현재 워크플로에 개별 명령으로 직접 연결되어 있지 않다. 공용 helper나 동일 기능의 다른 E2E가 CI에서 사용되는 경우와 혼동하지 않는다.

### 설정·지원 코드와 제외 범위

- [Docs package.json](../../apps/docs/package.json): suite별 명령과 pre-script.
- [기본 Playwright](../../apps/docs/playwright.config.ts), [상세](../../apps/docs/playwright.article.config.ts), [코드](../../apps/docs/playwright.code-block.config.ts), [공용 UI](../../apps/docs/playwright.ui.config.ts), [UI 소비](../../apps/docs/playwright.ui-consumer.config.ts), [푸시](../../apps/docs/playwright.push.config.ts), [CRP](../../apps/docs/playwright.crp.config.ts), [Activity](../../apps/docs/playwright.activity.config.ts): 설정 8개, 테스트 파일 수에는 제외.
- [Docs Backend package.json](../../apps/docs-backend/package.json), [API Jest 설정](../../apps/docs-backend/test/jest-e2e.json).
- [Vuln Radar Backend package.json](../../apps/vuln-radar-backend/package.json), [API Jest 설정](../../apps/vuln-radar-backend/test/jest-e2e.json).
- fixture 서버, 요청·파일 I/O probe, `test-utils`의 assertion helper는 지원 코드이며 독립 suite 파일로 중복 집계하지 않는다.
- `apps/vuln-radar` 프론트 및 `packages/api`에는 이번 파일명·runner import·스크립트 검색 범위에서 독립 테스트 파일/명령을 찾지 못했다.
- `packages/ui`에는 자체 `test` 스크립트가 없으며 공용 UI 테스트는 docs 소비 앱에서 실행한다.
- `apps/docs/shared/test.tsx`는 빈 div를 반환하는 컴포넌트다. 이름에 test가 있어도 테스트 runner 코드는 아니므로 제외했다.
- `test.mdx`, 이미지 파일, 테스트 설명 문서, 빌드 결과, node_modules, 테스트 결과 폴더는 제외했다.
- 별도 저장소의 HTTP/TCP 실험 및 `/tmp` 임시 검증 코드는 이 저장소 목록에 포함하지 않았다.

## 기대 결과

후속 전수 검사는 파일마다 목적, assertion의 실제 검증력, fixture 격리, timeout/retry/skip 이유, 중복, CI 실행 범위를 확인해야 한다. 목록이 존재한다는 이유만으로 기능 coverage나 배포 검증 완료를 판단하지 않는다.

파일 목록을 재확인할 때 저장소 루트에서 실행한다.

```sh
rg --files --hidden -g '!node_modules' -g '!.git' -g '!.next' \
  -g '!dist' -g '!build' -g '!playwright-report' -g '!test-results' \
  | rg '(\.(test|spec)\.(mjs|cjs|ts|tsx|js|jsx)$|\.e2e-spec\.(ts|js)$)'
git status --short
```

현재 snapshot에서 테스트 접미사 파일 131개를 찾는 것이 목록 재현 조건이다. 이후 파일이 추가·삭제되면 이 목록도 갱신한다. grep 결과 개수는 테스트 케이스 개수가 아니다.

## 실패 대응과 복구

- runner에 연결되지 않은 파일과 실제로 실행했으나 실패한 파일을 구분한다.
- 브라우저 의존성과 fixture 포트를 확인한 뒤 suite별로 실행한다. 기존 개발 서버를 재사용할 때 env가 다른지 확인한다.
- production 빌드 기반 suite는 같은 앱의 `.next`를 변경할 수 있으므로 개발 서버와 병렬 실행하지 않는다.
- 토큰·실제 NAS·외부 로깅·푸시 전송이 필요한 스크립트는 준비 조건과 영향 확인 후 실행한다.
- 이 작업에서는 테스트 코드, package 스크립트, CI 정책을 변경하지 않았다. 따라서 런타임 복구 작업은 해당 없음.

## 관련 검증

이번 작업은 목록 조사만 수행했으며 전수 테스트 결과 보고서는 아직 없다.

- [상세 렌더링 회귀 절차](docs-article-rendering-regression.md)
- [반응형·브라우저·기기 점검](docs-responsive-browser-device-checklist.md)
- [2026-10-12 목록 조사 기록](../worklog/2026-10/2026-10-12-repository-test-inventory.md)
