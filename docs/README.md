# Project Docs

이 디렉터리는 서비스에 노출되는 `apps/docs/data`와 별도로, 프로젝트 운영 문서를 관리하기 위한 공간입니다.

권장 규칙:

- `docs/architecture/`
  - 아키텍처 결정 기록(ADR), 큰 구조 변경, 데이터 흐름, 기술 선택 이유
  - 예: [docs/architecture/docs-app-fsd.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-app-fsd.md)
  - 예: [docs/architecture/blog-content-database-recommendation.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-database-recommendation.md)
  - 예: [docs/architecture/blog-content-html-vs-markdown.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-html-vs-markdown.md)
  - 예: [docs/architecture/blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
  - 예: [docs/architecture/docs-content-rendering-strategy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-rendering-strategy.md)
  - 예: [docs/architecture/ui-package-build-export.md](/Users/coder/Desktop/project/web-tech/docs/architecture/ui-package-build-export.md)
  - 예: [docs/architecture/ui-build-export-retrospective.md](/Users/coder/Desktop/project/web-tech/docs/architecture/ui-build-export-retrospective.md)
  - 예: [docs/architecture/docs-responsive-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-responsive-policy.md)
  - 예: [docs/architecture/docs-app-shell-rationale.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-app-shell-rationale.md)
- `docs/worklog/`
  - Codex 작업 로그, 협의 내용, 다음 액션, 열린 이슈
- `docs/process/`
  - 작업 방식, 문서화 규칙, 협업 운영 기준
- `docs/todo/`
  - 장기 개선 백로그, 우선순위별 TODO, 구조/디자인/인프라 개선 항목
  - 예: [docs/todo/platform-improvement-todo.md](/Users/coder/Desktop/project/web-tech/docs/todo/platform-improvement-todo.md)
- `docs/runbooks/`
  - 배포/운영/로컬 실행/장애 대응 절차
  - 예: [docs/runbooks/docs-env-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-env-checklist.md)

운영 원칙:

- 사용자에게 보여줄 콘텐츠는 `apps/docs/data`, `apps/docs/category`에 둡니다.
- 팀 내부 협의/메모/의사결정은 여기 `docs/` 아래에 둡니다.
- 큰 변경은 `worklog`에 남기고, 장기적으로 중요한 결정은 `architecture`의 ADR로 승격합니다.
- 모든 구현/수정 작업은 반드시 관련 문서 업데이트를 동반합니다.
  - 기본적으로 `docs/worklog/`는 매 작업마다 갱신합니다.
  - 장기 규칙이나 협업 기준은 `docs/process/`에서 관리합니다.

Codex와 함께 쓰는 방법:

1. 작업을 시작할 때 관련 ADR과 최근 worklog를 먼저 확인합니다.
2. 구현 중 결정이 바뀌면 `worklog`에 이유와 영향 범위를 짧게 남깁니다.
3. 재사용될 결정이면 새 ADR을 추가합니다.
4. 문서화 규칙은 [docs/process/codex-documentation-policy.md](/Users/coder/Desktop/project/web-tech/docs/process/codex-documentation-policy.md)를 기준으로 따릅니다.
5. 세션이 끝날 때 다음 사람이 바로 이어갈 수 있게 `Next` 섹션을 갱신합니다.
