# 설계와 정책

현재 구조, 기술 선택 이유, 계약과 정책을 찾는 목록입니다. 특정 시점의 실행 결과는 [검증 보고서](../verification/README.md)를 확인합니다.

[전체 문서 안내](../README.md)

## ADR 상태

2026-09-23에 ADR의 상태와 대체 관계를 확인했다. `적용 중`은 해당 범위의 결정이 현재 코드에 반영되었다는 의미이며 운영 배포·외부 소비처까지 검증 완료했다는 의미는 아니다. 상태의 원본은 각 ADR의 `상태와 범위`이며 전환할 때 이 목록도 함께 갱신한다.

| 결정                                                                            | 상태    | 범위 또는 후속 결정                                                          |
| ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| [ADR-0001: 초기 Docs Feed 구성](adr-0001-docs-feed-main.md)                     | 대체됨  | ADR-0003을 따른다.                                                           |
| [ADR-0002: 초기 About·Footer 구성](adr-0002-about-us-page-and-shared-footer.md) | 대체됨  | ADR-0004를 따른다.                                                           |
| [ADR-0003: 피드와 문서 인덱스 역할 분리](adr-0003-feed-and-docs-roles.md)       | 적용 중 | `/feed` 발견·큐레이션, `/docs` 검색·인덱스                                   |
| [ADR-0004: About 소개와 공용 셸](adr-0004-about-content-and-shared-shell.md)    | 적용 중 | 소개·작성자 정보, 문의 폼 제외                                               |
| [ADR-0005: 문서 카드의 재사용 경계](adr-0005-document-preview-card-boundary.md) | 적용 중 | feed·UI/UX 카드 공유, 인덱스 표현 분리                                       |
| [ADR-0006: 공용 UI의 Base UI 전환](adr-0006-shared-ui-base-ui.md)               | 적용 중 | 저장소 내 구현 반영, 외부 소비처 이전은 남아 있음                            |
| [ADR-0007: 검색 입력 계약 공유](adr-0007-search-input-contract.md)              | 적용 중 | 입력 계약 커밋·Production 성공·09-26 공개 화면 검사 연결, 이동 개선은 미배포 |

새 결정의 작성·대체 규칙은 [ADR 관리 규칙](../process/adr-management.md)을 참고합니다.

## 설계·정책 목록

아래 일반 정책 전체의 최신성을 이번 ADR 점검에서 검증한 것은 아니다. 관련 작업을 할 때 각 문서의 적용 범위·상태·검토일을 실제 코드와 대조한다.

- [Blog Content API Contract](blog-content-api-contract.md)
- [Blog Markdown DB Recommendation](blog-content-database-recommendation.md)
- [Blog Content Delivery: HTML vs Markdown](blog-content-html-vs-markdown.md)
- [Docs App FSD Guide](docs-app-fsd.md)
- [Docs App Information Architecture](docs-app-information-architecture.md)
- [Docs App Shell Rationale](docs-app-shell-rationale.md)
- [Docs Article Metadata Policy](docs-article-metadata-policy.md)
- [Docs Article Rendering Convergence](docs-article-rendering-convergence.md)
- [Docs Blog Improvement Roadmap](docs-blog-improvement-roadmap.md)
- [Computer Science Channel Evaluation](docs-computer-science-channel-evaluation.md)
- [Docs Content API Fail-Fast Policy](docs-content-api-fail-fast-policy.md)
- [Docs Content Asset Exposure Strategy](docs-content-asset-exposure-strategy.md)
- [Docs Content Authoring Markup Policy](docs-content-authoring-markup-policy.md)
- [Docs Content Authoring Pipeline](docs-content-authoring-pipeline.md)
- [콘텐츠 캐시 개선 우선순위](docs-content-cache-improvement-backlog.md)
- [Docs Content Cache Revalidation Policy](docs-content-cache-revalidation-policy.md)
- [Docs Content Operating Model](docs-content-operating-model.md)
- [Docs Content Rendering Strategy](docs-content-rendering-strategy.md)
- [Docs Content Routing Policy](docs-content-routing-policy.md)
- [Docs Design Token Usage Policy](docs-design-token-usage-policy.md)
- [Docs Document UI Reuse Policy](docs-document-ui-reuse-policy.md)
- [문서 화면의 정적 셸과 동적 영역 경계](docs-dynamic-content-boundaries.md)
- [Docs Feed And Docs Routing Policy](docs-feed-and-docs-routing-policy.md)
- [Docs Feed Filter Policy](docs-feed-filter-policy.md)
- [HEAPFORGE Alignment Checklist](docs-heapforge-alignment-checklist.md)
- [Infra Channel Evaluation](docs-infra-channel-evaluation.md)
- [Docs Loading UX Policy](docs-loading-ux-policy.md)
- [Docs Local MDX Shiki Timeout Analysis](docs-local-mdx-shiki-timeout-analysis.md)
- [Docs Local vs Remote Content Policy](docs-local-vs-remote-content-policy.md)
- [언어별 URL 라우팅 정책](docs-locale-url-routing-policy.md)
- [Docs Motion Interaction Policy](docs-motion-interaction-policy.md)
- [Docs Next Intl Usage Policy](docs-next-intl-usage-policy.md)
- [Docs Page Metadata Policy](docs-page-metadata-policy.md)
- [Remote Code Highlighting Sidecar](docs-remote-code-highlighting-sidecar.md)
- [Docs Resource Content Roadmap](docs-resource-content-roadmap.md)
- [docs-responsive-policy.md](docs-responsive-policy.md)
- [Docs Search API Contract](docs-search-api-contract.md)
- [Docs Search Experience Policy](docs-search-experience-policy.md)
- [Docs Secret And Token Lifecycle Policy](docs-secret-token-lifecycle-policy.md)
- [블로그 SSR 필요성 검증](docs-server-rendering-assessment.md)
- [Docs Vercel Platform Operations Policy](docs-vercel-platform-operations-policy.md)
- [UI Build Export Retrospective](ui-build-export-retrospective.md)
- [UI Package Build Export Strategy](ui-package-build-export.md)
